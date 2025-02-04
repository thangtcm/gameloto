import { io } from "https://cdn.socket.io/4.8.1/socket.io.esm.min.js";

var result = [];
var flgStop = false;
var numberLeft = 90;

function IsNumeric(n) {
    return !isNaN(n);
}

$(function() {
    const socket = io({
        query: {
            sessionId: localStorage.getItem("sessionId")
        }
    });

    let drawnNumbers = [];
    let players = {};
    let gameStarted = false;

    socket.on("session", (sessionId) => {
        localStorage.setItem("sessionId", sessionId);
    });

    socket.on("updatePlayers", (updatedPlayers) => {
        players = updatedPlayers;
        updateImageSelection();
        updatePlayerList();
    });

    socket.on("updateAvailableImages", (chosenImages) => {
        updateAvailableImages(chosenImages);
    });

    socket.on("numberDrawn", (number, allNumbers) => {
        drawnNumbers = allNumbers;
        $("#randomnumber").text(number);
        updateResult();
    });

    socket.on("gameReset", () => {
        location.reload();
    });

    socket.on("winner", (playerName) => {
        alert(`${playerName} đã thắng!`);
    });

    socket.on("winningNumbers", (winningNumbers) => {
        highlightWinningNumbers(winningNumbers);
    });

    socket.on("error", (message) => {
        alert(message);
    });

    $("#getit").click(function() {
        if (Object.keys(players).length > 0) {
            socket.emit("startGame");
            $("#getit").attr("hidden", true);
            $("#stopit").removeAttr("hidden");
        } else {
            alert("Cần ít nhất một người chơi để bắt đầu trò chơi.");
        }
    });

    $("#stopit").click(function() {
        socket.emit("stopGame");
        $("#stopit").attr("hidden", true);
        $("#getit").removeAttr("hidden");
    });

    $("#chooseImage").click(function() {
        const imageId = $("input[name='image']:checked").val();
        const playerName = $("#playerName").val();
        if (imageId && playerName) {
            socket.emit("chooseImage", imageId, playerName);
            $("#chooseImage").hide();
            $("#changeImage").show();
            $("#imagesList").hide();
            $("#selectedImage").attr("src", `./image/${imageId}.jpg`).show();
            $("#playerName").attr("disabled", true);
        } else {
            alert("Vui lòng chọn ảnh và nhập tên người chơi.");
        }
    });

    $("#changeImage").click(function() {
        if (!gameStarted) {
            $("#chooseImage").show();
            $("#imagesList").show();
            $("#changeImage").hide();
            $("#selectedImage").hide();
            $("#playerName").removeAttr("disabled");
        } else {
            alert("Không thể thay đổi ảnh khi trò chơi đã bắt đầu.");
        }
    });

    $("#resetGame").click(function() {
        const password = prompt("Nhập mật khẩu admin để reset game:");
        if (password) {
            socket.emit("resetGame", password);
        }
    });

    function updateImageSelection() {
        $("input[name='image']").each(function() {
            const imageId = $(this).val();
            if (players[imageId]) {
                $(this).attr("disabled", true);
            } else {
                $(this).removeAttr("disabled");
            }
        });
    }

    function updateAvailableImages(chosenImages) {
        $("input[name='image']").each(function() {
            const imageId = $(this).val();
            if (chosenImages.includes(imageId)) {
                $(this).parent().hide();
            } else {
                $(this).parent().show();
            }
        });
    }

    function updatePlayerList() {
        const playerList = $("#playerList");
        playerList.empty();
        for (const imageId in players) {
            const playerName = players[imageId].playerName;
            playerList.append(`<li>${playerName}</li>`);
        }
    }

    function updateResult() {
        let resultHtml = "";
        drawnNumbers.forEach(num => {
            resultHtml += `<span>${num}</span>, `;
        });
        $("#result").html(resultHtml.slice(0, -2));
    }

    function highlightWinningNumbers(winningNumbers) {
        $("#result span").each(function() {
            const num = parseInt($(this).text());
            if (winningNumbers.includes(num)) {
                $(this).css("color", "red");
            }
        });
    }
});

function inArray(needle, haystack) {
    var count = haystack.length;
    for (var i = 0; i < count; i++) {
        if (haystack[i] == needle) {
            return true;
        }
    }
    return false;
}

function randomNum(numLow, numHigh) {
    var adjustedHigh = parseFloat(numHigh) - parseFloat(numLow) + 1;
    var numRand = Math.floor(Math.random() * adjustedHigh) + parseFloat(numLow);

    return numRand;
}

function countDown() {
    if (this.flgStop == false) {
        var timeleft = $("#timeleft").val();
        var downloadTimer = setInterval(function() {
            if (timeleft <= 0 && this.flgStop == false) {
                clearInterval(downloadTimer);
                // $(#getit).click();
                document.getElementById("getit").click();
            } else if (this.flgStop == true) {
                document.getElementById("countdown").innerHTML = "Đã có người kinh";
            } else {
                document.getElementById("countdown").innerHTML = timeleft + " giây nữa...";
            }
            timeleft -= 1;
        }, 1000);
    } else {
        document.getElementById("countdown").innerHTML = "Đã có người kinh";
    }
}

function stopCountDown() {
    this.flgStop = true;
    $("#getit").removeAttr('hidden');
}

function clearScreen() {
    location.reload();
}

function checkNumber() {
    var number = $("#findNumber").val();
    // $("#textCheckNumber").attr("hidden", true);
    // $("#textCheckNumberWrong").attr("hidden", true);

    if (inArray(number, this.result)) {
        $(".alert-success").removeAttr('hidden');
        document.getElementById("textCheckNumber").innerHTML = "Có số " + number;
    } else {
        $(".alert-danger").removeAttr('hidden');
        document.getElementById("textCheckNumberWrong").innerHTML = "Không Có Số " + number;
    }
}
