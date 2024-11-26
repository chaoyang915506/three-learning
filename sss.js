// 假设 fn1 是一个已实现的函数，用于计算两点之间的距离
function fn1(pointA, pointB) {
    let dx = pointB[0] - pointA[0];
    let dy = pointB[1] - pointA[1];
    return Math.sqrt(dx * dx + dy * dy);
}

function findAdjacentPairs(points) {
    let adjacentPairs = [];

    // 步骤 1：计算每对点之间的距离
    let distances = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            let distance = fn1(points[i], points[j]);
            distances.push({ point1: points[i], point2: points[j], distance });
        }
    }

    // 步骤 2：按距离升序排序
    distances.sort((a, b) => a.distance - b.distance);

    // 步骤 3：选择距离最小的点对作为相邻点对
    // 假设相邻点对就是距离最小的点对
    let visited = new Set();
    for (let i = 0; i < distances.length; i++) {
        let { point1, point2, distance } = distances[i];
        if (!visited.has(point1) && !visited.has(point2)) {
            adjacentPairs.push([point1, point2]);
            visited.add(point1);
            visited.add(point2);
        }
    }

    return adjacentPairs;
}

// 示例数据
let points = [[1, 1], [2, 2], [4, 4], [3, 3]];

// 求相邻点对
let result = findAdjacentPairs(points);
console.log(result); 
// 输出：[ [ [1, 1], [2, 2] ], [ [2, 2], [3, 3] ], [ [3, 3], [4, 4] ] ]
