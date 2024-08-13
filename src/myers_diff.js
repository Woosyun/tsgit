const fs = require('fs');

class Diagonals {
    constructor(xLen, yLen, fill) {
        this.mid = yLen + 1;
        this.diagonals = new Array(2*(xLen + yLen) + 1).fill(fill);
    }
    get(idx) {
        return this.diagonals[this.mid + idx];
    }
    set(idx, val) {
        this.diagonals[this.mid + idx] = val;
    }
}

function loadAndSplitFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data.split('\n');        
    } catch (error) {
        console.log('Error:', error.stack);
    }
}

function FindMiddleSnake(A, N, B, M) {
  const delta = N - M;
  const odd = delta % 2 === 1;

  let VForward = new Diagonals(N, M, 0);
  let VReverse = new Diagonals(N, M, N);
  let x, y, u, v;
  let result = {
    x: null,
    y: null,
    u: null,
    v: null
  };

  if (N === 0 || M === 0)
    return result;
  
  for (let D = 0; D <= Math.ceil((M + N) / 2); D++) {
    for (let k = -D; k <= D; k += 2) {
      //1. find end of furthest reaching forward D-path in diagonal k
      if (k === -D || (k !== D && VForward.get(k + 1) > VForward.get(k - 1)))
        u = VForward.get(k + 1);
      else
        u = VForward.get(k - 1) + 1;
      v = u - k;
      x = u;
      y = v;

      while (u < N && v < M && A[u] === B[v]) {
        u++;
        v++;
      }
      VForward.set(k, u);

      if (x < u && y < v)//if length of snake is greater than 0
        result = { x, y, u, v };
      if (odd && delta - D < k && k < delta + D) {
        if (u >= VReverse.get(k))
          return result;
      }
      
      // console.log(`x: ${x}, y: ${y}, u: ${u}, v: ${v}`);
      // console.log('snake is ', result);
    }

    for (let k = -D; k <= D; k += 2 ) {    
      //2. find end of furthest reaching reverse D-path in diagonal k+delta
      const tempD = k + delta;
      if (k === D || (k !== -D && VReverse.get(tempD - 1) < VReverse.get(tempD + 1)))
        x = VReverse.get(tempD - 1);
      else
        x = VReverse.get(tempD + 1) - 1;
      y = x - tempD;
      u = x;
      v = y;

      while (x > 0 && y > 0 && A[x - 1] === B[y - 1]) {
        x--;
        y--;
      }
      VReverse.set(tempD, x);
      if (x < u && y < v)
        result = { x, y, u, v };

      if (!odd && -D <= tempD && tempD <= D) {
        if (x <= VForward.get(tempD))
          return result;
      }

      // console.log(`x: ${x}, y: ${y}, u: ${u}, v: ${v}`);
    }
  }
}

function makeEditScript(A, B, baseIndex) {
  const N = A.length;
  const M = B.length;

  const snake = FindMiddleSnake(A, N, B, M);
  const x = snake.x, y = snake.y, u = snake.u - 1, v = snake.v - 1;

  if (x != null) {
    const edits1 = makeEditScript(A.slice(0, x), B.slice(0, y), baseIndex);
    let snakeLength = (A.slice(0,x).length + B.slice(0, y).length - edits1.length) / 2; // even number of snakeLength should be guaranteed
    snakeLength = snakeLength + u - x + 1;
    // console.log('base index is ', baseIndex, ' snake length is ', snakeLength);

    const edits2 = makeEditScript(A.slice(u + 1, A.length), B.slice(v + 1, B.length), baseIndex + snakeLength);
    return edits1.concat(edits2);
  } else {
    // console.log('base index is ', baseIndex);
    const deletes = A.map((line) => {
      return { type: 'delete', index: baseIndex, content: line };
    });
    const adds = B.map((line) => {
      return { type: 'add', index: baseIndex, content: line };
    });
    return deletes.concat(adds);
  }
}

function getEditScript(file1Path, file2Path) {
  const A = loadAndSplitFile(file1Path);
  const B = loadAndSplitFile(file2Path);

  // A.forEach((line, idx) => {
  //   console.log(idx, ' ', line);
  // });
  // B.forEach((line, idx) => {
  //   console.log(idx, ' ', line);
  // });

  return makeEditScript(A, B, 0);
}

// const testCases = ['add_1.c', 'delete_1.c', 'move_1.c'];
// const dir = './samples/';
// const modifySuffix = '.m';

// testCases.forEach((fileName) => {
//   const o = dir + fileName;
//   const m = o + modifySuffix;
//   const re = getEditScript(o, m);
//   re.forEach((line) => {
//     console.log(line.type, ' ', line.index, ' ', line.content);
//   })
//   console.log('==================');
// })

module.exports = { getEditScript };