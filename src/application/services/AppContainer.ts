import { AuthService } from './AuthService';
import { ConsoleEmailService } from '../../infrastructure/email/ConsoleEmailService';
import { InMemoryUserRepository } from '../../infrastructure/repositories/InMemoryUserRepository';

export type Scope = 'singleton' | 'scoped' | 'transient';

interface BindingOptions {
  scope?: Scope;
  envs?: string[];
}

interface Provider {
  factory: (container: AppContainer) => unknown;
  scope: Scope;
  envs?: string[];
}

export const TOKENS = {
  userRepository: 'userRepository',
  emailService: 'emailService',
  authService: 'authService',
} as const;

export type ContainerToken = (typeof TOKENS)[keyof typeof TOKENS];

export class AppContainer {
  private readonly registry: Map<string, Provider>;
  private readonly instances: Map<string, unknown>;
  private readonly env: string;
  private readonly parent?: AppContainer;

  constructor(env = process.env.NODE_ENV ?? 'development', parent?: AppContainer) {
    this.env = env;
    this.parent = parent;
    this.registry = parent ? parent.registry : new Map();
    this.instances = new Map();
  }

  register(token: string, factory: (container: AppContainer) => unknown, options?: BindingOptions) {
    if (options?.envs && !options.envs.includes(this.env)) {
      return this;
    }
    const provider: Provider = {
      factory,
      scope: options?.scope ?? 'singleton',
      envs: options?.envs,
    };
    this.registry.set(token, provider);
    return this;
  }

  resolve<T = unknown>(token: string): T {
    const provider = this.registry.get(token);
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

    return instance as T;
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
    const userRepo = container.resolve(TOKENS.userRepository) as InMemoryUserRepository;
    const emailService = container.resolve(TOKENS.emailService);
    return new AuthService(userRepo, emailService);
  }, { scope: 'scoped' });

export { appContainer };
export default appContainer;
