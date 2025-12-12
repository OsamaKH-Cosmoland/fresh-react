import appContainer, { AppContainer, TOKENS, createAnalyticsClient, createLogger } from './AppContainer';
import { FakeClock } from '../../infrastructure/time/FakeClock';
import { FakeIdGenerator } from '../../infrastructure/ids/FakeIdGenerator';
import { ConsoleAnalyticsClient } from '../../infrastructure/analytics/ConsoleAnalyticsClient';
import { HttpAnalyticsClient } from '../../infrastructure/analytics/HttpAnalyticsClient';
import { InMemoryAnalyticsClient } from '../../infrastructure/analytics/InMemoryAnalyticsClient';
import { EnvConfigProvider } from '../../infrastructure/config/EnvConfigProvider';
import { SimpleFeatureFlagProvider } from '../../infrastructure/config/SimpleFeatureFlagProvider';
import { ConsoleLogger, NullLogger } from '../../infrastructure/logging';
import { StaticConfigProvider } from '../../infrastructure/config/StaticConfigProvider';
import { NoopCache } from '../../infrastructure/cache/NoopCache';

describe('AppContainer', () => {
  it('resolves a registered provider', () => {
    const container = new AppContainer('test');
    container.register('foo', () => ({ value: 1 }));
    expect(container.resolve<{ value: number }>('foo').value).toBe(1);
  });

  it('reuses singleton instances across scopes', () => {
    const container = new AppContainer('test');
    container.register('singleton', () => ({ id: Math.random() }), { scope: 'singleton' });
    const child = container.createScope();
    const first = child.resolve<object>('singleton');
    const second = child.resolve<object>('singleton');
    const sibling = container.createScope();
    expect(first).toBe(second);
    expect(first).toBe(sibling.resolve('singleton'));
  });

  it('creates unique scoped instances per scope', () => {
    const container = new AppContainer('test');
    container.register('scoped', () => ({ id: Math.random() }), { scope: 'scoped' });
    const scopeA = container.createScope();
    const scopeB = container.createScope();
    expect(scopeA.resolve<object>('scoped')).not.toBe(scopeB.resolve('scoped'));
  });

  it('throws when resolving an unknown token', () => {
    const container = new AppContainer('test');
    expect(() => container.resolve('missing')).toThrow(/No provider registered/);
  });

  it('skips bindings for mismatched environments', () => {
    const container = new AppContainer('prod');
    container.register('env-only', () => ({}), { envs: ['test'] });
    expect(() => container.resolve('env-only')).toThrow(/No provider registered/);
  });

  it('allows overriding clock and id generator per scope', () => {
    const container = new AppContainer('test');
    container.register(TOKENS.clock, () => new FakeClock("2024-01-01T00:00:00.000Z"), { scope: 'singleton' });
    const scoped = container.createScope();
    scoped.register(TOKENS.idGenerator, () => new FakeIdGenerator("T", 10), { scope: 'scoped' });

    expect(container.resolve(TOKENS.clock).now().toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(scoped.resolve(TOKENS.idGenerator).nextId()).toBe("T-10");
    expect(scoped.resolve(TOKENS.idGenerator).nextId()).toBe("T-11");
  });
});

describe('AppContainer analytics wiring', () => {
  it('uses the matching analytics client for the shared container', () => {
    const resolved = appContainer.resolve(TOKENS.analyticsClient);
    if (appContainer.env === 'test') {
      expect(resolved).toBeInstanceOf(InMemoryAnalyticsClient);
    } else {
      expect(resolved).toBeInstanceOf(ConsoleAnalyticsClient);
    }
  });

  it('creates InMemoryAnalyticsClient via helper for test environments', () => {
    const configProvider = new EnvConfigProvider();
    expect(createAnalyticsClient(configProvider, 'test')).toBeInstanceOf(InMemoryAnalyticsClient);
  });

  it('creates HttpAnalyticsClient when an endpoint is configured', () => {
    const configProvider = new StaticConfigProvider({
      values: { ANALYTICS_ENDPOINT: 'https://analytics.example.com/track' },
    });
    expect(createAnalyticsClient(configProvider, 'production')).toBeInstanceOf(HttpAnalyticsClient);
  });
});

describe('AppContainer config/feature flag wiring', () => {
  it('provides EnvConfigProvider via the shared container', () => {
    expect(appContainer.resolve(TOKENS.configProvider)).toBeInstanceOf(EnvConfigProvider);
  });

  it('builds SimpleFeatureFlagProvider using the shared config provider', () => {
    expect(appContainer.resolve(TOKENS.featureFlagProvider)).toBeInstanceOf(SimpleFeatureFlagProvider);
  });
});

describe('AppContainer cache wiring', () => {
  it('provides NoopCache for the shared container in test env', () => {
    expect(appContainer.resolve(TOKENS.cache)).toBeInstanceOf(NoopCache);
  });
});

describe('AppContainer logger wiring', () => {
  it('uses NullLogger for the shared container when NODE_ENV is test', () => {
    expect(appContainer.resolve(TOKENS.logger)).toBeInstanceOf(NullLogger);
  });

  it('creates NullLogger for test env via helper', () => {
    expect(createLogger('test')).toBeInstanceOf(NullLogger);
  });

  it('creates ConsoleLogger for production via helper', () => {
    expect(createLogger('production')).toBeInstanceOf(ConsoleLogger);
  });
});
