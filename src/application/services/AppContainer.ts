import type { EmailService } from '../../domain/shared/EmailService';
import type { UserRepository } from '../../domain/users/UserRepository';
import { AuthService } from './AuthService';
import { ConsoleEmailService } from '../../infrastructure/email/ConsoleEmailService';
import { InMemoryUserRepository } from '../../infrastructure/repositories/InMemoryUserRepository';

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
  authService: 'authService',
} as const;

export type ContainerToken = string;

export class AppContainer {
  private readonly registry: Map<ContainerToken, Provider<unknown>>;
  private readonly instances: Map<ContainerToken, unknown>;
  private readonly env: string;
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
    token: typeof TOKENS.authService,
    factory: (container: AppContainer) => AuthService,
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
  resolve(token: typeof TOKENS.authService): AuthService;
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

const seededUsers = [{ id: 'server-user', email: 'user@example.com', name: 'Server User' }];

appContainer
  .register(TOKENS.userRepository, () => new InMemoryUserRepository(seededUsers), { scope: 'scoped' })
  .register(TOKENS.emailService, () => new ConsoleEmailService(), { scope: 'singleton' })
  .register(TOKENS.authService, (container) => {
    const userRepo = container.resolve(TOKENS.userRepository);
    const emailService = container.resolve(TOKENS.emailService);
    return new AuthService(userRepo, emailService);
  }, { scope: 'scoped' });

export { appContainer };
export default appContainer;
