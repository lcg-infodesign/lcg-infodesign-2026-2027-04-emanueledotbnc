// pagina di dettaglio per il singolo fiume scelto dalla visione d'insieme
let myTable, riverRow;

// variabili per salvare i dati del fiume che sto visualizzando
let riverName, riverContinent, riverCountries, riverOutflow;
let riverLength, riverDischarge, tempMin, tempMax, tempAvg, riverColor;

// mi salvo i massimi e minimi di tutto il dataset così posso scalare tutto in modo proporzionale
let maxLength = 0, minDischarge = 99999999, maxDischarge = 0;
let tempScaleMin = 100, tempScaleMax = -100;

// colori base che ho usato anche nella pagina principale
let colorBackground, colorGrey, colorMuted, colCold, colTemp, colWarm;
let margin = 48;
let backText = "← Back to overview";
let backWidth;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  // carico il csv
  myTable = await loadTable("../assets/rivers.csv", ",", "header");
  frameRate(30);
  angleMode(DEGREES);
  textFont("Helvetica");

  // definisco la palette colori
  colorBackground = color(15, 23, 42);
  colorGrey = color(217, 217, 217);
  colorMuted = color(148, 163, 184);
  colCold = color(59, 130, 246);
  colTemp = color(103, 232, 249);
  colWarm = color(239, 68, 68);

  // prendo il parametro id dall'url della pagina e cerco la riga corrispondente nella tabella
  let params = getURLParams();
  riverRow = myTable.findRow(params.id, "id");

  // giro su tutta la tabella per trovare i valori minimi e massimi di riferimento
  for (let i = 0; i < myTable.getRowCount(); i++) {
    let l = myTable.getNum(i, "length");
    if (l > maxLength) maxLength = l;

    let d = myTable.getNum(i, "discharge");
    if (d < minDischarge) minDischarge = d;
    if (d > maxDischarge) maxDischarge = d;

    let tMin = myTable.getNum(i, "min_temp");
    if (tMin < tempScaleMin) tempScaleMin = tMin;

    let tMax = myTable.getNum(i, "max_temp");
    if (tMax > tempScaleMax) tempScaleMax = tMax;
  }

  // se ho trovato la riga giusta, tiro fuori tutti i dati del fiume
  if (riverRow) {
    riverName = riverRow.get("name");
    riverContinent = riverRow.get("continent");
    // uniformo Australia a Oceania per coerenza con la prima pagina
    if (riverContinent === "Australia") riverContinent = "Oceania";
    riverCountries = riverRow.get("countries");
    riverOutflow = riverRow.get("outflow");
    riverLength = riverRow.getNum("length");
    riverDischarge = riverRow.getNum("discharge");
    tempMin = riverRow.getNum("min_temp");
    tempMax = riverRow.getNum("max_temp");
    tempAvg = riverRow.getNum("avg_temp");
    riverColor = getTemperatureColor(tempAvg);
  }

  // calcolo quanto è lungo il testo per tornare indietro così so dove cliccare
  textSize(14);
  backWidth = textWidth(backText);
}

// decido il colore del fiume in base alla temperatura media (freddo, temperato o caldo)
function getTemperatureColor(temperature) {
  if (temperature < 5) return colCold;
  if (temperature <= 18) return colTemp;
  return colWarm;
}

// calcolo l'ondulazione verticale del fiume: faccio aumentare le anse man mano che vado verso la foce
function getCenterY(y, px, lengthInPixels) {
  let amplitude = 10 + 24 * (px / lengthInPixels);
  return y + amplitude * sin(px * 2.2);
}

// disegno il glifo del fiume dalla sorgente alla foce usando tanti cerchi affiancati
function disegnaGlifo(x, y, lengthInPixels, thickness) {
  push();
  noStroke();
  let r = red(riverColor), g = green(riverColor), b = blue(riverColor);

  // faccio 3 passaggi per creare l'effetto alone sfumato intorno al corpo del fiume
  for (let layer = 0; layer < 3; layer++) {
    let mult = 1.9;
    let alphaVal = 15;
    if (layer === 1) { mult = 1.4; alphaVal = 30; }
    else if (layer === 2) { mult = 1.0; alphaVal = 75; }

    fill(r, g, b, alphaVal);
    // parto stretto alla sorgente e mi allargo fino allo spessore massimo alla foce
    for (let px = 0; px <= lengthInPixels; px = px + 3) {
      let diametro = map(px, 0, lengthInPixels, 2, thickness * mult);
      ellipse(x + px, getCenterY(y, px, lengthInPixels), diametro, diametro);
    }
  }

  // traccio la linea centrale più netta e il puntino che indica la sorgente
  fill(riverColor);
  for (let px = 0; px <= lengthInPixels; px = px + 1.5) {
    ellipse(x + px, getCenterY(y, px, lengthInPixels), 2.5, 2.5);
  }
  ellipse(x, y, 8, 8);

  // scrivo l'etichetta della sorgente a sinistra
  fill(colorMuted);
  textSize(11);
  textStyle(BOLD);
  textAlign(LEFT, BOTTOM);
  text("SOURCE", x - 4, y - 26);

  // per la foce controllo se ci sta a destra del fiume, altrimenti la metto sopra per non tagliarla
  let endY = getCenterY(y, lengthInPixels, lengthInPixels);
  let mouthText = "MOUTH  ·  " + riverOutflow;
  if (x + lengthInPixels + thickness + textWidth(mouthText) + 30 < width - margin) {
    textAlign(LEFT, CENTER);
    text(mouthText, x + lengthInPixels + thickness / 2 + 16, endY);
  } else {
    textAlign(RIGHT, BOTTOM);
    text(mouthText, x + lengthInPixels, y - 100);
  }
  pop();
}

// funzione per disegnare i singoli blocchi con i dati numerici e la legenda
function drawStat(x, y, label, value, valueColor, hint) {
  push();
  noStroke();
  textAlign(LEFT, TOP);
  fill(colorMuted);
  textSize(11);
  textStyle(BOLD);
  text(label, x, y);
  fill(valueColor);
  textSize(26);
  text(value, x, y + 16);
  fill(colorMuted);
  textSize(12);
  textStyle(NORMAL);
  text(hint, x, y + 52);
  pop();
}

// disegno la sezione della temperatura con la barra divisa nelle 3 fasce termiche
function drawTemperature(x, y) {
  let barWidth = 300;
  let barY = y + 80;
  drawStat(x, y, "AVERAGE TEMPERATURE", tempAvg + " °C", riverColor,
    "colour of the line  ·  range " + tempMin + " to " + tempMax + " °C");

  push();
  noStroke();
  // ciclo sulle 3 fasce (freddo, temperato, caldo)
  for (let k = 0; k < 3; k++) {
    let zStart = tempScaleMin, zEnd = 5, zColor = colCold, zLabel = "cold";
    if (k === 1) { zStart = 5; zEnd = 18; zColor = colTemp; zLabel = "temperate"; }
    else if (k === 2) { zStart = 18; zEnd = tempScaleMax; zColor = colWarm; zLabel = "warm"; }

    let xStart = map(zStart, tempScaleMin, tempScaleMax, x, x + barWidth);
    let xEnd = map(zEnd, tempScaleMin, tempScaleMax, x, x + barWidth);

    // sfondo trasparente della fascia
    fill(red(zColor), green(zColor), blue(zColor), 55);
    rect(xStart, barY, xEnd - xStart, 8);

    // coloro in pieno solo il pezzo di barra che rientra tra min e max del fiume scelto
    let from = tempMin > zStart ? tempMin : zStart;
    let to = tempMax < zEnd ? tempMax : zEnd;
    if (from < to) {
      let xFrom = map(from, tempScaleMin, tempScaleMax, x, x + barWidth);
      let xTo = map(to, tempScaleMin, tempScaleMax, x, x + barWidth);
      fill(zColor);
      rect(xFrom, barY, xTo - xFrom, 8);
    }

    // etichetta sotto ogni fascia
    fill(colorMuted);
    textSize(11);
    textAlign(CENTER, TOP);
    text(zLabel, (xStart + xEnd) / 2, barY + 14);
  }

  // triangolino bianco per segnare esattamente dove cade la temperatura media
  let xAvg = map(tempAvg, tempScaleMin, tempScaleMax, x, x + barWidth);
  fill(255);
  triangle(xAvg - 5, barY - 10, xAvg + 5, barY - 10, xAvg, barY - 2);
  pop();
}

// titolo in alto con il nome del fiume, il continente e i paesi attraversati
function drawTitle(x, y) {
  push();
  noStroke();
  textAlign(LEFT, TOP);
  fill(colorMuted);
  textSize(12);
  textStyle(BOLD);
  text("DEGREES OF FLOW  ·  RIVER DETAIL", x, y);

  // se il nome del fiume è troppo lungo riduco il font per non farlo sbordare
  let nameSize = 46;
  if (riverName.length > 34) nameSize = 24;
  else if (riverName.length > 18) nameSize = 34;

  fill(241, 245, 249);
  textSize(nameSize);
  text(riverName, x, y + 24, min(width - margin * 2, 760), 80);

  fill(colorGrey);
  textSize(14);
  textStyle(NORMAL);
  text(riverContinent + "  ·  " + riverCountries, x, y + 98, min(width - margin * 2, 760), 40);
  pop();
}

// controllo se il mouse è sopra la scritta per tornare alla home
function isMouseOverBackLink() {
  return mouseX > margin && mouseX < margin + backWidth && mouseY > 32 && mouseY < 58;
}

// se clicco sul link torno alla visione d'insieme
function mousePressed() {
  if (isMouseOverBackLink()) window.location.href = "index.html";
}

function draw() {
  background(colorBackground);

  // disegno il link in alto a sinistra e cambio cursore se ci passo sopra
  push();
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(BOLD);
  if (isMouseOverBackLink()) { fill(255); cursor(HAND); }
  else { fill(103, 232, 249); cursor(ARROW); }
  text(backText, margin, 36);
  pop();

  // se qualcuno apre la pagina con un id sbagliato o vuoto mostro un messaggio di avviso
  if (!riverRow) {
    noStroke();
    fill(241, 245, 249);
    textAlign(LEFT, TOP);
    textSize(24);
    textStyle(BOLD);
    text("River not found", margin, 90);
    fill(colorGrey);
    textSize(14);
    textStyle(NORMAL);
    text("Open this page from the overview, or add ?id=1 … " + myTable.getRowCount() + " to the address.", margin, 126);
    return;
  }

  drawTitle(margin, 72);

  // disegno le 3 colonne dei dati e le lineette verticali che le separano
  let statsY = 222;
  drawStat(margin, statsY, "LENGTH", riverLength + " km", 255, "length of the line");
  drawStat(margin + 230, statsY, "DISCHARGE", riverDischarge + " m³/s", 255, "width of the river at its mouth");
  drawTemperature(margin + 500, statsY);

  let centerY = height * 0.66;
  push();
  stroke(51, 65, 85);
  line(margin + 210, statsY, margin + 210, statsY + 108);
  line(margin + 480, statsY, margin + 480, statsY + 108);
  // box di sfondo dove andrà a posizionarsi il fiume
  fill(20, 31, 56);
  stroke(30, 41, 59);
  rect(margin, centerY - 130, width - margin * 2, 260, 16);
  pop();

  // mappo lunghezza e portata rispetto ai massimi del dataset per farli stare nel riquadro
  let lengthInPixels = map(riverLength, 0, maxLength, 120, width - margin * 2 - 64);
  let thickness = map(riverDischarge, minDischarge, maxDischarge, 8, 52);
  disegnaGlifo(margin + 32, centerY, lengthInPixels, thickness);
}