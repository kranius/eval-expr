function compute() {
    let expr = document.getElementById("expression").value;
    let result = calculette(expr);

    paragraph = document.createElement("p");
    paragraph.innerHTML = expr + " = " + result;
    document.getElementById("results").appendChild(paragraph);
}

function reset() {
    console.log("clearing...");
    document.getElementById("results").innerHTML = "";
    document.getElementById("expression").value = "";
}