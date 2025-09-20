# Anvil Performance Testing Framework

This directory contains the comprehensive performance testing infrastructure for Anvil Phase 2 optimization work.

## Overview

The performance testing framework provides:
- **API Performance Testing**: Response time, throughput, and load testing for backend endpoints
- **Frontend Benchmarking**: Page load, component rendering, and interactivity measurements
- **Regression Detection**: Automated comparison against baselines to catch performance degradations
- **Memory Monitoring**: Heap usage tracking and memory leak detection

## Files Structure

```
tests/performance/
├── README.md                    # This documentation
├── frontend-benchmarks.js       # Frontend performance tests (requires puppeteer)
├── regression-detector.js       # Automated regression detection framework
├── baselines/                   # Performance baselines
│   └── baseline.json           # Current performance baseline
├── results/                     # Test results
│   ├── latest.json             # Latest API performance results
│   ├── frontend-latest.json    # Latest frontend performance results
│   └── performance-*.json      # Historical results
└── reports/                     # Regression detection reports
    ├── latest-regression-report.json
    └── regression-report-*.json
```

## Quick Start

### 1. Run API Performance Tests

```bash
# Run comprehensive API performance tests
node scripts/performance-test.js

# Results saved to tests/performance/results/
```

### 2. Create Performance Baseline

```bash
# Create initial baseline for regression detection
node tests/performance/regression-detector.js --create-baseline
```

### 3. Check for Regressions

```bash
# Run regression detection against baseline
node tests/performance/regression-detector.js
```

### 4. Frontend Performance (requires puppeteer)

```bash
# Install puppeteer first
npm install puppeteer

# Run frontend benchmarks
node tests/performance/frontend-benchmarks.js
```

## Current Performance Baseline

Based on initial testing on the current system:

### API Performance
- **Features endpoint**: ~7ms average, ~9ms P95
- **Status endpoint**: ~14ms average, ~19ms P95
- **Single feature endpoint**: ~6ms average, ~7ms P95
- **Update operations**: ~7ms average
- **Load testing**: 567+ req/s sustained, 765+ req/s concurrent

### Memory Usage
- Stable memory usage with no significant leaks detected
- Memory actually decreases slightly during testing (garbage collection)

## Performance Thresholds

### API Thresholds (Regression Detection)
- Features endpoint: <50ms average, <100ms P95
- Status endpoint: <30ms average, <60ms P95
- Single feature: <30ms average, <60ms P95
- Updates: <100ms average
- Load test: >300 req/s minimum
- Memory increase: <10MB maximum

### Frontend Thresholds (When Available)
- Page load: <3 seconds
- First contentful paint: <1.5 seconds
- Component render: <500ms
- Click response: <100ms
- Input response: <50ms

## Integration with CI/CD

### Manual Testing
```bash
# Quick performance check
npm run test:performance

# Full regression analysis
npm run test:regression
```

### Automated Regression Detection
The regression detector can be integrated into CI/CD pipelines:

```bash
# In CI pipeline
node tests/performance/regression-detector.js
# Exit code 0 = no regressions, 1 = regressions detected
```

## Performance Optimization Workflow

1. **Establish Baseline**: Run tests before optimization work
2. **Make Optimizations**: Implement performance improvements
3. **Validate Improvements**: Run regression detector to confirm gains
4. **Update Baseline**: If improvements are significant, update baseline

## Monitoring Other Agents' Work

This testing framework is designed to validate optimizations made by other agents:

### Backend Agent Optimizations
- Database query optimization
- API response caching
- Endpoint efficiency improvements

### Frontend Agent Optimizations
- Component rendering performance
- Bundle size optimization
- Resource loading improvements

### Infrastructure Agent Optimizations
- Server configuration tuning
- Load balancing improvements
- Caching layer optimization

## Troubleshooting

### Common Issues

1. **Server not available**: Ensure Anvil server is running at localhost:3000
2. **Permission errors**: Check file system permissions in results directory
3. **Memory errors**: Increase Node.js heap size if needed: `node --max-old-space-size=4096`

### Debug Mode

Add debug logging to any test:
```bash
DEBUG=true node scripts/performance-test.js
```

## Extending the Framework

### Adding New API Tests
Edit `scripts/performance-test.js` and add new test methods to the `PerformanceTester` class.

### Adding Frontend Tests
Edit `tests/performance/frontend-benchmarks.js` and add new measurement methods.

### Custom Regression Thresholds
Modify the baseline thresholds in `regression-detector.js` or the baseline.json file.

## Reports and Analysis

All test results are saved with timestamps for historical analysis:

- **JSON Results**: Machine-readable data for automated analysis
- **Console Output**: Human-readable summaries and alerts
- **Regression Reports**: Detailed comparison analysis

Results can be used for:
- Performance trending over time
- Identifying optimization opportunities
- Validating performance improvements
- CI/CD gate decisions

## Next Steps

1. **Establish Baselines**: ✅ Complete - Current baseline established
2. **Validate Optimizations**: Ready to test other agents' improvements
3. **Continuous Monitoring**: Set up automated regression testing
4. **Performance Trending**: Collect historical data for analysis

The performance testing framework is now ready to support Anvil Phase 2 optimization work!