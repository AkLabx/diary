import { getParentPath, registerBackHandler, _getRegistry, _clearRegistry, _getPathByIdx, _setPathByIdx, _clearPathByIdx } from './useHardwareBackButton';

describe('useHardwareBackButton utils', () => {
  beforeEach(() => {
    _clearRegistry();
    _clearPathByIdx();
  });

  describe('getParentPath', () => {
    it('returns null for roots', () => {
      expect(getParentPath('/')).toBeNull();
      expect(getParentPath('/app')).toBeNull();
      expect(getParentPath('/login')).toBeNull();
      expect(getParentPath('/app/calendar')).toBeNull();
      expect(getParentPath('/app/search')).toBeNull();
      expect(getParentPath('/app/profile')).toBeNull();
      expect(getParentPath('/app/mystuff')).toBeNull();
    });

    it('returns null for independent screens', () => {
      expect(getParentPath('/privacy')).toBeNull();
      expect(getParentPath('/terms')).toBeNull();
    });

    it('returns parent paths correctly', () => {
      expect(getParentPath('/app/new')).toBe('/app');
      expect(getParentPath('/app/entry/123')).toBe('/app');
      expect(getParentPath('/app/edit/123')).toBe('/app/entry/123');
      expect(getParentPath('/app/mystuff/images')).toBe('/app/mystuff');
      expect(getParentPath('/app/mystuff/audio')).toBe('/app/mystuff');
    });

    it('ignores trailing slash', () => {
      expect(getParentPath('/app/mystuff/')).toBeNull();
      expect(getParentPath('/app/mystuff/images/')).toBe('/app/mystuff');
    });
  });

  describe('Registry', () => {
    it('sorts by priority descending, then most recent first', () => {
      const h1 = () => true;
      const h2 = () => true;
      const h3 = () => true;

      registerBackHandler(50, h1);
      registerBackHandler(70, h2);
      registerBackHandler(50, h3);

      const registry = _getRegistry();
      expect(registry.length).toBe(3);
      // Expected order: Priority 70 (h2), Priority 50 newer (h3), Priority 50 older (h1)
      expect(registry[0].handler).toBe(h2);
      expect(registry[1].handler).toBe(h3);
      expect(registry[2].handler).toBe(h1);
    });

    it('deregisters correctly', () => {
      const h1 = () => true;
      const unregister = registerBackHandler(50, h1);

      expect(_getRegistry().length).toBe(1);
      unregister();
      expect(_getRegistry().length).toBe(0);
    });
  });

  describe('Path History tracking', () => {
    it('updates correctly', () => {
       _setPathByIdx(0, '/login');
       _setPathByIdx(1, '/app');

       const paths = _getPathByIdx();
       expect(paths[0]).toBe('/login');
       expect(paths[1]).toBe('/app');
    });
  });
});
