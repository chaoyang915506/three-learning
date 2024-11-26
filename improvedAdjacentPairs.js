/**
 * 更高效的相邻点对查找算法
 * 思路：
 * 1. 使用最小生成树(MST)的思想，每个点只需要和最近的未访问点配对
 * 2. 通过空间分区优化距离计算
 * 3. 使用Map存储每个点的最近邻点，避免重复计算
 */

// 辅助函数：计算两点距离
function calculateDistance(pointA, pointB) {
    const dx = pointB[0] - pointA[0];
    const dy = pointB[1] - pointA[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function findAdjacentPairsOptimized(points) {
    if (points.length < 2) return [];
    
    // 使用Map存储每个点的最近邻点
    const nearestNeighbors = new Map();
    
    // 对点进行排序（按x坐标），这样可以减少搜索范围
    const sortedPoints = [...points].sort((a, b) => a[0] - b[0]);
    
    // 为每个点找到最近的未配对的邻点
    for (let i = 0; i < sortedPoints.length; i++) {
        const currentPoint = sortedPoints[i];
        let minDistance = Infinity;
        let nearestPoint = null;
        
        // 只需要向后搜索一定范围内的点
        // 因为已经按x排序，如果x差值已经大于当前最小距离，后面的点一定更远
        for (let j = i + 1; j < sortedPoints.length; j++) {
            const nextPoint = sortedPoints[j];
            
            // 剪枝：如果x坐标差值已经大于当前最小距离，可以停止搜索
            if (nextPoint[0] - currentPoint[0] > minDistance) break;
            
            // 如果该点已经被配对，跳过
            if (nearestNeighbors.has(nextPoint)) continue;
            
            const distance = calculateDistance(currentPoint, nextPoint);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = nextPoint;
            }
        }
        
        // 如果找到最近点且未被配对，则建立配对关系
        if (nearestPoint && !nearestNeighbors.has(currentPoint)) {
            nearestNeighbors.set(currentPoint, nearestPoint);
            nearestNeighbors.set(nearestPoint, currentPoint);
        }
    }
    
    // 构建结果数组
    const result = [];
    const visited = new Set();
    
    for (const [point1, point2] of nearestNeighbors.entries()) {
        if (!visited.has(point1)) {
            result.push([point1, point2]);
            visited.add(point1);
            visited.add(point2);
        }
    }
    
    return result;
}

// 测试代码
const points = [[1, 1], [2, 2], [4, 4], [3, 3]];
console.log(findAdjacentPairsOptimized(points));

// 性能测试
function performanceTest() {
    const largePoints = Array.from({ length: 1000 }, () => [
        Math.random() * 1000,
        Math.random() * 1000
    ]);
    
    console.time('Original');
    findAdjacentPairs(largePoints);
    console.timeEnd('Original');
    
    console.time('Optimized');
    findAdjacentPairsOptimized(largePoints);
    console.timeEnd('Optimized');
}

performanceTest(); 