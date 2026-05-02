# Problem
All computed properties (`flowNodes`, `flowEdges`, `progressByNode`, `visibleNodeIds`) loop the entire tree on every change. No benchmarking tooling exists to measure performance degradation as tree size grows.

# Improvement Needed
Create a performance benchmarking script that generates trees of increasing size (10, 50, 100, 500, 1000 nodes) and measures computed property execution time.

# Expected Result
Future agents can objectively measure performance impact before and after optimization work without manual profiling.
