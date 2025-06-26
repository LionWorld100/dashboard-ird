// Função para atualizar o primeiro semestre
function updateFinanceiroSemestre1() {
    const totalInvestidoEl = document.getElementById("total-investido-semestre1");
    const retornoTotalEl = document.getElementById("retorno-total-semestre1");
    const roiEl = document.getElementById("roi-semestre1");

    if (!totalInvestidoEl || !retornoTotalEl || !roiEl) return;

    const mesesPrimeiroSemestre = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN"];
    
    let totalInvestidoPrimeiroMes = 0;
    let retornoTotalSemestre = 0;
    let primeiroMesDoAnoEncontrado = false;

    // Obter todos os anos presentes nos dados
    const anos = new Set();
    for (const sheetName in excelData) {
        const ano = sheetName.substring(3); // Assume que o ano está nos últimos 2 dígitos (ex: JAN24 -> 24)
        anos.add(ano);
    }

    // Iterar sobre os anos para encontrar o primeiro mês de cada ano
    for (const ano of Array.from(anos).sort()) { // Ordenar anos para garantir JAN24 antes de JAN25
        const janSheetName = `JAN${ano}`;
        if (excelData[janSheetName] && excelData[janSheetName].metrics) {
            if (!primeiroMesDoAnoEncontrado) {
                totalInvestidoPrimeiroMes = excelData[janSheetName].metrics.totalDepositado;
                primeiroMesDoAnoEncontrado = true;
            }
        }

        // Somar ganhos para os seis primeiros meses do ano
        for (const mesAbrev of mesesPrimeiroSemestre) {
            const sheetName = `${mesAbrev}${ano}`;
            if (excelData[sheetName] && excelData[sheetName].metrics) {
                retornoTotalSemestre += excelData[sheetName].metrics.totalGanhos;
            }
        }
    }

    const roi = totalInvestidoPrimeiroMes !== 0 ? (retornoTotalSemestre / totalInvestidoPrimeiroMes) : 0;

    totalInvestidoEl.textContent = formatCurrency(totalInvestidoPrimeiroMes);
    retornoTotalEl.textContent = formatCurrency(retornoTotalSemestre);
    roiEl.textContent = formatPercentage(roi, true);
}

