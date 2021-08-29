// 初始为 DOM 版
var version = "dom";
// 获取节点
var tips = document.getElementById("tips");
var dom = document.getElementById("domBoard");
var canvas = document.getElementById("canvasBoard");
var lineX = canvas.width;
var lineY = canvas.height;
var ctx = canvas.getContext("2d");

var lineCount = 20 // 线条数
var chessCount = 0; // 棋子数量初始为 0
var chessR = Math.floor((lineX/lineCount)/2.5); // 棋子半径

// 提示
function prompt(tipsText) {
    tips.innerHTML = tipsText;
    setTimeout(() => {
        tips.innerHTML = "🤔🤔🤔"
    }, 5000);
}

// 绘制 Canvas 棋盘
function drawCanvasBoard() {
    // 绘制背景色，指定线条色
    ctx.fillStyle = "#cae8d5";
    ctx.fillRect(0, 0, lineX, lineY);
    ctx.strokeStyle = "#84a9ac";
    // 绘制棋盘线
    for (i=0; i<lineCount+1; i++) {
        // 绘制横线
        ctx.moveTo((lineX/lineCount)*i, 0);
        ctx.lineTo((lineX/lineCount)*i, lineY);
        ctx.stroke();
        // 绘制竖线
        ctx.moveTo(0, (lineY/lineCount)*i);
        ctx.lineTo(lineX, (lineY/lineCount)*i);
        ctx.stroke();
    };
}

var xyRange = []; // 可落棋的 x, y 坐标范围
for(i=1; i<lineCount; i++){
    var xy = (lineX/lineCount)*i;
    xyRange.push(xy);
};

var chessArr = []; // 落棋点的二维数组
// 初始化落棋点的二维数组
function initChessArr() {
    for (i=0; i<lineCount; i++){
        chessArr[i] = [];
        for (j=0; j<lineCount; j++){
            chessArr[i][j] = 0;
        }
    }
}
initChessArr();

// 记录黑棋，白棋落子的坐标
var playX = []; // 落棋后, 棋子的 X 坐标值, 如 X=140
var playY = []; // 落棋后, 棋子的 Y 坐标值, 如 Y=60
var playColor = []; // 落棋颜色, 1黑 2白
var play_x = [];  // 落棋后, 棋子的 x 坐标点, 如 x=9
var play_y = []; // 落棋后, 棋子的 y 坐标点, 如 y=5

// 被移出 playX/Y 数组的坐标将被存入以下数组，撤销悔棋时调用
var popX = []; // 悔棋后, 棋子的 X 坐标值, 如 X=140
var popY = []; // 悔棋后, 棋子的 Y 坐标值, 如 Y=80
var popColor = []; // 悔棋颜色, 1黑 2白
var pop_x = []; // 悔棋后, 棋子的 x 坐标值, 如 x=5
var pop_y = []; // 悔棋后, 棋子的 y 坐标值, 如 y=2

// 监听坐标
dom.addEventListener("click", coordinate);
function coordinate(event) {
    // 通过点击事件获取坐标值，并处理为简单的坐标点
    var x = (Math.round(event.offsetX/(lineCount/2))*10)/lineCount;
    var y = (Math.round(event.offsetY/(lineCount/2))*10)/lineCount;

    // 落棋时的实际坐标
    var X = x*lineCount;
    var Y = y*lineCount;

    // 判断坐标点(x,y)是否在 xyRange 范围内,避免棋子落在横线竖线上
    var Xe = xyRange.indexOf(X);
    var Ye = xyRange.indexOf(Y);
   
    if (Xe != -1 && Ye != -1 && chessArr[x][y] == 0) {
        var drawColor = ((chessCount+1)%2 == 0) ? 2 : 1;
        drawChess(X, Y, x, y, drawColor);
        // 悔棋后，棋子落在新坐标上，应清空悔棋时的旧坐标信息，避免旧坐标可撤销悔棋
        clearPopXY();
    } 
}

// DOM 版棋子
function domChess(X, Y, color) {
    var chess = document.createElement("div");
    chess.id = "bw" + chessCount;
    chess.style.width = "16px";
    chess.style.height = "16px";
    chess.style.borderRadius = "50%";
    if (color === 1) {
        chess.style.background = "radial-gradient(6px 6px at 7px 7px, #636766, #0a0a0a)";
    } else if (color === 2) {
        chess.style.background = "radial-gradient(10px 10px at 7px 7px, #f9fcfb, #D1D1D1)";
    }
    chess.style.boxShadow = "2px 2px 4px rgba(0,0,0,0.4)";
    chess.style.left = X - (14/2) + "px";
    chess.style.top = Y - (14/2) + "px";
    chess.style.position = "absolute";
    dom.appendChild(chess);
    chessCount++;
}

// canvas 版棋子
function canvasChess(X, Y, color) {
    var gradient = ctx.createRadialGradient(X+1, Y+1, chessR+1, X, Y, 0);
    ctx.beginPath();
    ctx.arc(X, Y, chessR, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fillStyle = gradient;
    if (color === 1) {
        gradient.addColorStop(0, "#0a0a0a");
        gradient.addColorStop(1, "#636766");
    } else if (color === 2) {
        gradient.addColorStop(0, "#D1D1D1");
        gradient.addColorStop(1, "#f9fcfb");
    }  
    ctx.fill();
    chessCount++;
}

// 绘制棋子
function drawChess(X, Y, x, y, drawColor) {
    clearPopXY();
    // 在矩阵中用 1 或 2 标记绘制的黑白棋
    chessArr[x][y] = drawColor;

    if (version === "dom") {
        domChess(X, Y, drawColor);
    } else if (version === "canvas") {
        canvasChess(X, Y, drawColor);
    }

    isWin(x, y, drawColor);

    playX.push(X);
    playY.push(Y);
    playColor.push(drawColor);
    play_x.push(x);
    play_y.push(y);
}

// 清除棋子
function clearChess() {
    if (version === "dom") {
        // 通过找到需移除div 的 id，实现悔棋
        var id = "bw" + (chessCount-1).toString();
        var del_id = document.getElementById(id);
        dom.removeChild(del_id);
    } else if (version === "canvas") {
        // 清除 canvas 画布上的棋子
        var clearX = playX[playX.length-1];
        var clearY = playY[playY.length-1];
        ctx.save(); 
        ctx.beginPath();
        ctx.arc(clearX, clearY, chessR+1, 0, 2 * Math.PI); 
        ctx.clip();
        ctx.beginPath();
        drawCanvasBoard();
        ctx.restore();
    }
    chessCount--;
}

// 清除 Canvas 画布
function clearCanvas() {
    ctx.save(); // 保存当前状态
    ctx.beginPath(); // 防止出现圆圈路径
    ctx.clearRect(0, 0, lineX, lineY); // 直接清除整张画布
    ctx.beginPath();
    drawCanvasBoard(); // 重绘画布
    ctx.restore(); // 恢复保存的状态
}

// 清除 DOM 节点
function clearDomNodes() {
    while(dom.hasChildNodes()) {
        dom.removeChild(dom.lastChild);
    }
}

// 复原棋局
function restoreChessBoard() {
    // DOM <--> Canvas, 清除 DOM 子节点/画布
    // 不清空 playX/Y 等数组, 用数组中记录的坐标信息来复原棋局  
    for (i=0; i<playX.length; i++) {
        for (j=i; j<playY.length; j++) {
            for (k=j; k<playColor.length; k++) {
                if (version === "canvas") {
                    canvasChess(playX[i], playY[j], playColor[k]);
                } else if (version === "dom") {
                    domChess(playX[i], playY[j], playColor[k]);
                }   
                break;
            }
            break;
        }
    }  
}

// 清空悔棋坐标
function clearPopXY() {
    popX.splice(popX.length-1, 1);
    popY.splice(popY.length-1, 1);
    pop_x.splice(pop_x.length-1, 1);
    pop_y.splice(pop_y.length-1, 1);
    popColor.splice(popColor.length-1, 1);
}

// 悔棋
function redo() {
    if (chessCount > 0) {
        // 调用清除棋子的函数
        clearChess();

        // 需悔棋的坐标点（x，y）
        var redoX = play_x[play_x.length-1];
        var redoY = play_y[play_y.length-1];

        // 将悔棋点改为0，后续点击该位置可再次落子
        chessArr[redoX][redoY] = 0;
        
        // 清除最后一次落棋点的坐标, 并记录在 popX/Y 数组中
        var domX = playX.pop();
        popX.push(domX);
        var domY = playY.pop();
        popY.push(domY);

        // 记录悔棋的颜色
        var redoColor = playColor.pop();
        popColor.push(redoColor);

        // 记录悔棋的坐标点（x，y）
        var pop_x1 = play_x.pop();
        var pop_y1 = play_y.pop();
        pop_x.push(pop_x1);
        pop_y.push(pop_y1);
    } else {
        prompt("😬 无棋可悔");
    }
}

// 撤销悔棋
function undo() {
    if (popX.length > 0 ) {
        
        // 撤销悔棋的坐标值, 如(20, 360)
        var undoX = popX[popX.length-1];
        var undoY = popY[popY.length-1];
        // 撤销悔棋的坐标点, 如(1, 18)
        var domX = pop_x[pop_x.length-1];
        var domY = pop_y[pop_y.length-1]
        var undoColor = popColor[popColor.length-1]; // 撤销悔棋的棋子颜色
        drawChess(undoX, undoY, domX, domY, undoColor); // 重绘棋子，完成撤销
    } else {
        prompt("😬 无棋可撤");
    }
}

// 重新开始
function restart() {
    // 移除所有棋子的节点
    if (version === "dom") {
        clearDomNodes();
    } else if (version === "canvas") {
        clearCanvas();
    }
    
    // 清空相关数组
    playX.splice(0, playX.length);
    playY.splice(0, playY.length);
    playColor.splice(0, playColor.length);
    play_x.splice(0, play_x.length);
    play_y.splice(0, play_y.length);
    popX.splice(0, popX.length);
    popY.splice(0, popY.length);
    popColor.splice(0, popColor.length);
    pop_x.splice(0, pop_x.length);
    pop_y.splice(0, pop_y.length);

    chessCount = 0;

    initChessArr(); // 初始化棋盘矩阵
    prompt("😎 已重新开局, 请下棋");
}

// 切换版本
function switchVersion() {
    if (version === "dom") {
        clearDomNodes(); // 清除 DOM 版子节点
        dom.style.display = "none"; // 隐藏 DOM
        canvas.style.display = "block" // 显示 Canvas
        drawCanvasBoard(); // 重绘画布
        chessCount = 0;
        version = "canvas";
        changeText("GoBang Canvas", "DOM");
        dom.removeEventListener('click', coordinate);
        canvas.addEventListener("click", coordinate); // 切换监听 Canvas 节点
        restoreChessBoard(); // 在 Canvas 版恢复 DOM 版的棋局
    } else {
        dom.style.display = "block"; // 隐藏 Canvas
        canvas.style.display = "none"; // 显示 DOM
        clearCanvas(); // 清除当前画布
        chessCount = 0;
        version = "dom";
        changeText("GoBang DOM", "Canvas");
        canvas.removeEventListener('click', coordinate);
        dom.addEventListener("click", coordinate); // 切换监听 DOM 节点
        restoreChessBoard(); // 在 DOM 版恢复 Canvas 版的棋局
    } 
}

// 修改版本标题, 按钮文本
function changeText(versionTitle, buttonText) {
    document.getElementById("version").innerHTML = versionTitle;
    document.getElementById("switch").innerHTML = buttonText;
}

// 胜负判断
function isWin(x, y, winColor) {
    var horizontalCount = 0;
    var verticalCount = 0;
    var forwardObliqueCount = 0;
    var negativeObliqueCount = 0;

    // 横向判断
    // 从落子的位置向左依次寻找坐标上是否有同色的棋子
    for (i=x; i>=0; i--) {
        if (chessArr[i][y] != winColor) {
            break;
        }
        horizontalCount++;
    }
    // 从落子的位置向右寻找
    for (i=x+1; i<20; i++) {
        if (chessArr[i][y] != winColor) {
            break;
        }
        horizontalCount++;
    }

    // 纵向判断
    // 从落子的位置向上寻找
    for (i=y; i>=0; i--) {
        if (chessArr[x][i] != winColor){
            break;
        }
        verticalCount++;
    }
    // 从落子的位置向下寻找
    for (i=y+1; i<20; i++) {
        if (chessArr[x][i] != winColor) {
            break;
        }
        verticalCount++;
    }

    // 正斜判断(左上至右下)
    // 从落子的位置向左上寻找
    for (i=x,j=y; i>=0,j>=0; i--,j--) {
        if (i<0 || j<0 || chessArr[i][j] != winColor) {
            break;
        }
        forwardObliqueCount++;
    }
    // 从落子的位置向右下寻找
    for (i=x+1,j=y+1; i<20,j<20; i++,j++){
        if (i>=20 || j>=20 || chessArr[i][j] != winColor) {
            break;
        }
        forwardObliqueCount++;
    }

    // 负斜判断(右上至左下)
    // 从落子的位置向左下寻找
    for (i=x,j=y; i>=0,j<20; i--,j++) {
        if (i<0 || j>=20 || chessArr[i][j] != winColor) {
            break;
        }
        negativeObliqueCount++;
    }
    // 从落子的位置向右上寻找
    for (i=x+1,j=y-1; i<20,j>=0; i++,j--) {
        if (i>=20 || j<0 || chessArr[i][j] != winColor) {
            break;
        }
        negativeObliqueCount++;
    }

    // 判断是否五子连珠，获胜方是黑棋还是白棋
    if (horizontalCount==5 || verticalCount==5 || forwardObliqueCount==5 || negativeObliqueCount==5) {
        prompt("👏👏👏 恭喜" + (winColor == 1 ? "黑棋" : "白棋") + "获胜!");
        setTimeout(() => {
            restart();
        }, 3000);
    }
}

