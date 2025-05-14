import 'styled-components';
import { theme } from './config/theme/themeVariables';

type ThemeType = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends ThemeType {}
}