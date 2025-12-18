import type { EmailService } from '../../domain/shared/EmailService';
import type { NotificationService } from '../../domain/shared/NotificationService';
import type { Clock } from '../../domain/shared/Clock';
import type { IdGenerator } from '../../domain/shared/IdGenerator';
import type { UserRepository } from '../../domain/users/UserRepository';
import type { AnalyticsClient } from '@/domain/analytics/AnalyticsClient';
import type { Cache } from '@/domain/cache/Cache';
import type { ConfigProvider } from '@/domain/config/ConfigProvider';
import type { FeatureFlagProvider } from '@/domain/config/FeatureFlagProvider';
import type { Logger } from '@/domain/logging/Logger';
import { AuthService } from './AuthService';
import { ConsoleEmailService } from '../../infrastructure/email/ConsoleEmailService';
import { createDefaultNotificationService } from '../../infrastructure/notifications/createDefaultNotificationService';
import { FakeNotificationService } from '../../infrastructure/notifications/FakeNotificationService';
import { InMemoryUserRepository, defaultSeededUsers } from '../../infrastructure/repositories/InMemoryUserRepository';
import { SystemClock } from '../../infrastructure/time/SystemClock';
import { DefaultIdGenerator } from '../../infrastructure/ids/DefaultIdGenerator';
import { ConsoleAnalyticsClient } from '@/infrastructure/analytics/ConsoleAnalyticsClient';
import { HttpAnalyticsClient } from '@/infrastructure/analytics/HttpAnalyticsClient';
import { InMemoryAnalyticsClient } from '@/infrastructure/analytics/InMemoryAnalyticsClient';
import { EnvConfigProvider } from '@/infrastructure/config/EnvConfigProvider';
import { SimpleFeatureFlagProvider } from '@/infrastructure/config/SimpleFeatureFlagProvider';
import { InMemoryCache, NoopCache } from '@/infrastructure/cache';
import { ConsoleLogger, NullLogger } from '@/infrastructure/logging';
import { configureLogger as configureGlobalLogger } from '@/logging/globalLogger';

export type Scope = 'singleton' | 'scoped' | 'transient';

interface BindingOptions {
  scope?: Scope;
  envs?: string[];
}

interface Provider<TValue> {
  factory: (container: AppContainer) => TValue;
  scope: Scope;
  envs?: string[];
}

export const TOKENS = {
  userRepository: 'userRepository',
  emailService: 'emailService',
  notificationService: 'notificationService',
  authService: 'authService',
  clock: 'clock',
  idGenerator: 'idGenerator',
  configProvider: 'configProvider',
  featureFlagProvider: 'featureFlagProvider',
  cache: 'cache',
  analyticsClient: 'analyticsClient',
  logger: 'logger',
} as const;

export type ContainerToken = string;

export class AppContainer {
  private readonly registry: Map<ContainerToken, Provider<unknown>>;
  private readonly instances: Map<ContainerToken, unknown>;
  readonly env: string;
  private readonly parent?: AppContainer;

  constructor(env = process.env.NODE_ENV ?? 'development', parent?: AppContainer) {
    this.env = env;
    this.parent = parent;
    this.registry = parent ? parent.registry : new Map<ContainerToken, Provider<unknown>>();
    this.instances = new Map<ContainerToken, unknown>();
  }

  register(
    token: typeof TOKENS.userRepository,
    factory: (container: AppContainer) => UserRepository,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.emailService,
    factory: (container: AppContainer) => EmailService,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.notificationService,
    factory: (container: AppContainer) => NotificationService,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.authService,
    factory: (container: AppContainer) => AuthService,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.clock,
    factory: (container: AppContainer) => Clock,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.idGenerator,
    factory: (container: AppContainer) => IdGenerator,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.configProvider,
    factory: (container: AppContainer) => ConfigProvider,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.featureFlagProvider,
    factory: (container: AppContainer) => FeatureFlagProvider,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.analyticsClient,
    factory: (container: AppContainer) => AnalyticsClient,
    options?: BindingOptions,
  ): this;
  register(
    token: typeof TOKENS.logger,
    factory: (container: AppContainer) => Logger,
    options?: BindingOptions,
  ): this;
  register<T>(token: ContainerToken, factory: (container: AppContainer) => T, options?: BindingOptions): this;
  register<T>(token: ContainerToken, factory: (container: AppContainer) => T, options?: BindingOptions): this {
    if (options?.envs && !options.envs.includes(this.env)) {
      return this;
    }
    const provider: Provider<T> = {
      factory,
      scope: options?.scope ?? 'singleton',
      envs: options?.envs,
    };
    this.registry.set(token, provider);
    return this;
  }

  resolve(token: typeof TOKENS.userRepository): UserRepository;
  resolve(token: typeof TOKENS.emailService): EmailService;
  resolve(token: typeof TOKENS.notificationService): NotificationService;
  resolve(token: typeof TOKENS.authService): AuthService;
  resolve(token: typeof TOKENS.clock): Clock;
  resolve(token: typeof TOKENS.idGenerator): IdGenerator;
  resolve(token: typeof TOKENS.configProvider): ConfigProvider;
  resolve(token: typeof TOKENS.featureFlagProvider): FeatureFlagProvider;
  resolve(token: typeof TOKENS.cache): Cache;
  resolve(token: typeof TOKENS.analyticsClient): AnalyticsClient;
  resolve(token: typeof TOKENS.logger): Logger;
  resolve<T = unknown>(token: ContainerToken): T;
  resolve<T = unknown>(token: ContainerToken): T {
    const provider = this.registry.get(token) as Provider<T> | undefined;
    if (!provider) {
      throw new Error(`No provider registered for token "${token}"`);
    }
    if (provider.envs && !provider.envs.includes(this.env)) {
      throw new Error(`Provider for token "${token}" not registered for env "${this.env}"`);
    }

    const cacheTarget = provider.scope === 'singleton' ? this.getRoot() : this;
    if ((provider.scope === 'singleton' || provider.scope === 'scoped') && cacheTarget.instances.has(token)) {
      return cacheTarget.instances.get(token) as T;
    }

    const instance = provider.factory(this);

    if (provider.scope !== 'transient') {
      cacheTarget.instances.set(token, instance);
    }

    return instance;
  }

  createScope() {
    return new AppContainer(this.env, this.getRoot());
  }

  private getRoot(): AppContainer {
    return this.parent ? this.parent.getRoot() : this;
  }
}

const appContainer = new AppContainer();

const defaultLogger = createLogger(appContainer.env);

export function createAnalyticsClient(configProvider: ConfigProvider, env: string): AnalyticsClient {
  if (env === 'test') {
    return new InMemoryAnalyticsClient();
  }
  const endpoint = configProvider.get('ANALYTICS_ENDPOINT');
  if (endpoint) {
    return new HttpAnalyticsClient(endpoint);
  }
  return new ConsoleAnalyticsClient();
}

export function createConfigProvider(): ConfigProvider {
  return new EnvConfigProvider();
}

export function createFeatureFlagProvider(configProvider: ConfigProvider): FeatureFlagProvider {
  return new SimpleFeatureFlagProvider(configProvider);
}

export function createLogger(env: string): Logger {
  if (env === 'test') {
    return new NullLogger();
  }
  return new ConsoleLogger();
}

appContainer
  .register(TOKENS.clock, () => new SystemClock(), { scope: 'singleton' })
  .register(TOKENS.idGenerator, () => new DefaultIdGenerator('NG'), { scope: 'singleton' })
  .register(TOKENS.userRepository, () => new InMemoryUserRepository(defaultSeededUsers), { scope: 'scoped' })
  .register(TOKENS.emailService, () => new ConsoleEmailService(), { scope: 'singleton' })
  .register(TOKENS.configProvider, () => createConfigProvider(), { scope: 'singleton' })
  .register(
    TOKENS.featureFlagProvider,
    (container) => createFeatureFlagProvider(container.resolve(TOKENS.configProvider)),
    { scope: 'singleton' },
  )
  .register(TOKENS.cache, (container) => (container.env === 'test' ? new NoopCache() : new InMemoryCache()), {
    scope: 'singleton',
  })
  .register(
    TOKENS.notificationService,
    (container) => {
      if (container.env === 'test') {
        return new FakeNotificationService();
      }
      const configProvider = container.resolve(TOKENS.configProvider);
      return createDefaultNotificationService(configProvider);
    },
    { scope: 'singleton' },
  )
  .register(TOKENS.authService, (container) => {
    const userRepo = container.resolve(TOKENS.userRepository);
    const notificationService = container.resolve(TOKENS.notificationService);
    return new AuthService(userRepo, notificationService);
  }, { scope: 'scoped' })
  .register(
    TOKENS.analyticsClient,
    (container) => createAnalyticsClient(container.resolve(TOKENS.configProvider), container.env),
    { scope: 'singleton' },
  );
appContainer.register(TOKENS.logger, () => defaultLogger, { scope: 'singleton' });
configureGlobalLogger(defaultLogger);

export { appContainer };
export default appContainer;
