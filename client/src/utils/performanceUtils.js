// Performance monitoring utilities for React components

export const measureRenderTime = (componentName) => {
  return {
    start: () => {
      const startTime = performance.now()
      return () => {
        const endTime = performance.now()
        const renderTime = endTime - startTime
        console.log(`🎯 ${componentName} render time: ${renderTime.toFixed(2)}ms`)
        return renderTime
      }
    }
  }
}

export const withPerformanceMonitoring = (WrappedComponent, componentName) => {
  return function PerformanceMonitoredComponent(props) {
    const measureEnd = measureRenderTime(componentName).start()

    React.useLayoutEffect(() => {
      measureEnd()
    })

    return React.createElement(WrappedComponent, props)
  }
}

// Bundle size analyzer helper
export const analyzeBundleSize = async () => {
  if (typeof window !== 'undefined' && window.performance) {
    const navigation = performance.getEntriesByType('navigation')[0]
    const resources = performance.getEntriesByType('resource')

    const jsResources = resources.filter(resource =>
      resource.name.includes('.js') && !resource.name.includes('hot-update')
    )

    const totalJSSize = jsResources.reduce((acc, resource) => {
      return acc + (resource.transferSize || 0)
    }, 0)

    console.log(`📦 Total JS bundle size: ${(totalJSSize / 1024).toFixed(2)} KB`)
    console.log(`⚡ DOMContentLoaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`)
    console.log(`🏁 Load complete: ${navigation.loadEventEnd - navigation.loadEventStart}ms`)

    return {
      bundleSize: totalJSSize,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart
    }
  }

  return null
}

// React performance profiler
export const ProfilerWrapper = ({ id, children, onRender }) => {
  const handleRender = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    console.log(`🔍 Profiler [${id}]:`, {
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      startTime: `${startTime.toFixed(2)}ms`,
      commitTime: `${commitTime.toFixed(2)}ms`
    })

    if (onRender) {
      onRender(id, phase, actualDuration, baseDuration, startTime, commitTime)
    }
  }

  return React.createElement(
    React.Profiler,
    { id, onRender: handleRender },
    children
  )
}