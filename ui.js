function compute() {
    let expr = document.getElementById("expression").value;
    let result = calculette(expr);

    paragraph = document.createElement("p");
    paragraph.innerHTML = expr + " = " + result;
    document.getElementById("results").appendChild(paragraph);
}

function reset() {
    document.getElementById("results").innerHTML = "";
    document.getElementById("expression").value = "";
}

document.getElementById("calc").addEventListener("click", compute);

document.getElementById("reset").addEventListener("click", reset);