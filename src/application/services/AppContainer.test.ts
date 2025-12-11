import { AppContainer, TOKENS } from './AppContainer';
import { FakeClock } from '../../infrastructure/time/FakeClock';
import { FakeIdGenerator } from '../../infrastructure/ids/FakeIdGenerator';

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
