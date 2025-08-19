# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-19

### 🎉 Major Release: ReactCurrentDispatcher Error Fixed

### Added

- **Multi-format builds**: ESM, CommonJS, UMD, and minified UMD
- **Modern package.json exports**: Proper module resolution for all bundlers
- **ESM support**: Native ES modules for Vite, Webpack 5+, and modern bundlers
- **Improved TypeScript types**: Enhanced type definitions for better developer experience
- **Solid layer properties**: Added `sc` (solid color), `sw` (solid width), `sh` (solid height) to Layer interface

### Fixed

- **🚨 CRITICAL**: Fixed `ReactCurrentDispatcher` error in Vite and modern React applications
- **React externalization**: Properly externalized React and ReactDOM dependencies
- **Module resolution**: Fixed import issues with modern bundlers
- **Animation rendering**: Fixed solid layer color rendering (was showing black instead of specified colors)
- **Type safety**: Updated types to support `string | LottieData | ArrayBuffer` for src prop

### Changed

- **Build system**: Migrated from single UMD build to multi-format distribution
- **Package structure**: Updated `main`, `module`, and `exports` fields for proper module resolution
- **JSX runtime**: Uses modern React 17+ JSX transform
- **Development**: Removed debug console statements from production build

### Technical Details

- **Bundle sizes**: ESM ~15KB, UMD minified ~8KB
- **React compatibility**: Supports React 16.8+, 17, 18, and 19
- **Zero breaking changes**: Maintains 100% API compatibility
- **Modern tooling**: Full Vite, Webpack 5+, and modern bundler support

### Migration

No migration required - the API remains identical. Simply update to v1.1.0 and the ReactCurrentDispatcher error will be resolved.

## [1.0.1] - Previous Release

- Initial release with UMD build
- Basic Lottie animation support
- React component and hook API
