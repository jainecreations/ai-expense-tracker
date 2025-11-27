import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

export default function useResolvedTheme() {
  const appearance = useThemeStore((s) => s.appearance);
  const sys = useColorScheme();
  const resolved = appearance === 'system' ? (sys || 'light') : appearance;
  const isDark = resolved === 'dark';

  const classFor = (lightClass: string, darkClass: string) => (isDark ? darkClass : lightClass);

  return { resolved, isDark, classFor };
}
