// Dashboard principal
let excelData = {};

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api/auth';

// Funções de formatação (escopo global)
function formatCurrency(value) {
    const number = parseFloat(value);
    if (isNaN(number)) return "R$ 0,00";
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercentage(value, treatAsFraction = false) {
    const number = parseFloat(value);
    if (isNaN(number)) return "0,00%";
    // Se treatAsFraction for true, o valor já é a fração (ex: 0.1 = 10%)
    // Se for false (ou omitido), assume que é um número a ser multiplicado por 100 (ex: 10 = 10%)
    const percentageValue = treatAsFraction ? number * 100 : number;
    return percentageValue.toFixed(2).replace(".", ",") + "%";
}

document.addEventListener("DOMContentLoaded", function () {
    // Variáveis globais
    let currentMonth = "";
    let currentPeriod = "day";
    let mainChart = null;
    let donutChart = null;
    
    // Configurações para extração dos dados do Excel
    const CONFIG = {
        HEADER_ROW_INDEX: 15, // Linha 16 (índice 0-based)
        START_DATA_ROW_INDEX: 18, // Linha 19
        END_DATA_ROW_INDEX: 48, // Linha 49
        COL_DIA_LETTER: "G", // Coluna G para "Dia"
        COL_DEPOSITOS_LETTER: "H", // Coluna H para "Depósitos"
        COL_GANHOS_LETTER: "I", // Coluna I para "Ganhos"
        COL_PERCENTUAL_LETTER: "E", // Coluna E para "Porcentagem" (Revertido para E)
        CELL_TOTAL_DEPOSITADO: "H12",
        CELL_PERCENTUAL_MEDIO: "J12",
        CELL_PROJECAO_30_DIAS: "E12",
        // Configurações para dados de plataformas
        PLATAFORMAS_RANGES: [
            { start: 65, end: 98 }, // Linhas 66-99 (índice 0-based)
            { start: 112, end: 142 }, // Linhas 113-143 (índice 0-based)
            { start: 156, end: 186 } // Linhas 157-187 (índice 0-based)
        ],
        PLATAFORMAS_COL_DIA_LETTER: "G", // Coluna G para "Dia"
        PLATAFORMAS_COL_PLATAFORMA_LETTER: "C", // Coluna C para "Plataforma"
        PLATAFORMAS_COL_GANHOS_LETTER: "I", // Coluna I para "Ganhos"
        PLATAFORMAS_COL_PERCENTUAL_LETTER: "E" // Coluna E para "Percentual"
    };
    
    // Converter letra da coluna para índice (A=0, B=1, ...)
    function getExcelColIndex(colLetter) {
        return colLetter.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
    }
    
    const COL_DIA_INDEX = getExcelColIndex(CONFIG.COL_DIA_LETTER);
    const COL_DEPOSITOS_INDEX = getExcelColIndex(CONFIG.COL_DEPOSITOS_LETTER);
    const COL_GANHOS_INDEX = getExcelColIndex(CONFIG.COL_GANHOS_LETTER);
    const COL_PERCENTUAL_INDEX = getExcelColIndex(CONFIG.COL_PERCENTUAL_LETTER);
    
    // Índices para dados de plataformas
    const PLATAFORMAS_COL_DIA_INDEX = getExcelColIndex(CONFIG.PLATAFORMAS_COL_DIA_LETTER);
    const PLATAFORMAS_COL_PLATAFORMA_INDEX = getExcelColIndex(CONFIG.PLATAFORMAS_COL_PLATAFORMA_LETTER);
    const PLATAFORMAS_COL_GANHOS_INDEX = getExcelColIndex(CONFIG.PLATAFORMAS_COL_GANHOS_LETTER);
    const PLATAFORMAS_COL_PERCENTUAL_INDEX = getExcelColIndex(CONFIG.PLATAFORMAS_COL_PERCENTUAL_LETTER);
    
    // Inicializar o dashboard
    initializeDashboard();
    
    function initializeDashboard() {
        // Configurar eventos
        setupEventListeners();
        
        // Carregar dados do localStorage se existirem
        loadDataFromLocalStorage();
        
        // Inicializar navegação
        setupNavigation();
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        // Upload de arquivo
        document.getElementById("file-upload").addEventListener("change", handleFileUpload);
        
        // Botões de período
        document.querySelectorAll(".period-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                document.querySelectorAll(".period-btn").forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentPeriod = this.getAttribute("data-period");
                updateChart(currentMonth);
            });
        });
        
        // Botões de toggle para detalhes dos KPIs
        document.querySelectorAll(".kpi-toggle-btn").forEach(btn => {
            btn.addEventListener("click", function() {
                console.log("Botão de toggle clicado!");
                const cardId = this.id.replace("-toggle", "");
                const detailsElement = document.getElementById(`${cardId}-details`);
                console.log(`Card ID: ${cardId}, Details Element:`, detailsElement);
                
                // Inicializar estado collapsed se não estiver definido
                if (!detailsElement.classList.contains("collapsed") && detailsElement.style.maxHeight === "") {
                    detailsElement.classList.add("collapsed");
                    detailsElement.style.maxHeight = "0px";
                }
                
                if (detailsElement.classList.contains("collapsed")) {
                    detailsElement.classList.remove("collapsed");
                    detailsElement.style.maxHeight = detailsElement.scrollHeight + "px";
                    this.querySelector("i").classList.remove("fa-chevron-down");
                    this.querySelector("i").classList.add("fa-chevron-up");
                    console.log(`Detalhes expandidos. ScrollHeight: ${detailsElement.scrollHeight}px`);
                } else {
                    detailsElement.classList.add("collapsed");
                    detailsElement.style.maxHeight = "0px";
                    this.querySelector("i").classList.remove("fa-chevron-up");
                    this.querySelector("i").classList.add("fa-chevron-down");
                    console.log("Detalhes recolhidos.");
                }
            });
        });
        
        // Botão de exportar
        document.getElementById("export-btn").addEventListener("click", function() {
            document.getElementById("export-modal").style.display = "block";
        });
        
        // Fechar modal
        document.querySelector(".modal .close").addEventListener("click", function() {
            document.getElementById("export-modal").style.display = "none";
        });
        
        // Botões de exportação
        document.getElementById("export-excel").addEventListener("click", function() {
            exportData("excel");
            document.getElementById("export-modal").style.display = "none";
        });
        
        document.getElementById("export-csv").addEventListener("click", function() {
            exportData("csv");
            document.getElementById("export-modal").style.display = "none";
        });
        
        // Botão de excluir importação
        const deleteBtn = document.getElementById("delete-import-settings-btn");
        if (deleteBtn) { // Verificar se o botão existe
             deleteBtn.addEventListener("click", function() {
                if (confirm("Tem certeza que deseja excluir os dados importados?")) {
                    localStorage.removeItem("excelChartData");
                    alert("Dados excluídos com sucesso!");
                    location.reload();
                }
            });
        }
       
        
        // Fechar modal ao clicar fora
        window.addEventListener("click", function(event) {
            const modal = document.getElementById("export-modal");
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });

        // Event listener para o filtro de ano
        document.getElementById("year-select").addEventListener("change", function() {
            updateMonthTabs();
            updateChart(currentMonth);
        });
        
        // Event listener para o filtro de ano financeiro
        const yearSelectFinanceiro = document.getElementById("year-select-financeiro");
        if (yearSelectFinanceiro) {
            yearSelectFinanceiro.addEventListener("change", function() {
                updateFinanceiro(currentMonth);
            });
        }
    }
    
    // Configurar navegação
    function setupNavigation() {
        const menuItems = document.querySelectorAll(".sidebar-menu li");
        const contentSections = document.querySelectorAll(".content-section");
        
        menuItems.forEach(item => {
            item.addEventListener("click", function() {
                const targetId = this.id.replace("menu-", "");
                const targetContent = document.getElementById(`${targetId}-content`);
                
                // Atualizar menu ativo
                menuItems.forEach(mi => mi.classList.remove("active"));
                this.classList.add("active");
                
                // Atualizar conteúdo ativo
                contentSections.forEach(section => section.classList.remove("active"));
                // A seção "visao-geral" não tem um content separado, ela é o conteúdo principal
                if (targetId === "visao-geral") {
                     // Mostra os elementos principais da visão geral (KPIs, Gráficos)
                     document.querySelector(".kpi-cards").style.display = "grid"; 
                     document.querySelector(".charts-section").style.display = "grid";
                } else if (targetContent) {
                    targetContent.classList.add("active");
                     // Esconde os elementos principais da visão geral se outra seção for selecionada
                     document.querySelector(".kpi-cards").style.display = "none"; 
                     document.querySelector(".charts-section").style.display = "none";
                } else {
                     // Se não houver conteúdo específico (ex: visão geral), mostra os elementos principais
                     document.querySelector(".kpi-cards").style.display = "grid"; 
                     document.querySelector(".charts-section").style.display = "grid";
                }
            });
        });
        
        // Event listener específico para "Meus resultados"
        const calcularRoiBtn = document.getElementById("calcular-roi-btn");
        if (calcularRoiBtn) {
            calcularRoiBtn.addEventListener("click", calcularMeusResultados);
        }
        
        // Event listener para formatação de moeda no campo valor investido
        const valorInvestidoInput = document.getElementById("valor-investido");
        if (valorInvestidoInput) {
            valorInvestidoInput.addEventListener("input", formatarCampoMoeda);
            valorInvestidoInput.addEventListener("blur", formatarCampoMoeda);
        }
        // Garantir que a visão geral esteja ativa por padrão
        document.getElementById("menu-visao-geral").classList.add("active");
        document.querySelector(".kpi-cards").style.display = "grid"; 
        document.querySelector(".charts-section").style.display = "grid";
    }
    
    // Carregar dados do localStorage
    function loadDataFromLocalStorage() {
        const storedData = localStorage.getItem("excelChartData");
        if (storedData) {
            try {
                excelData = JSON.parse(storedData);
                updateMonthTabs();
                updateMeusResultadosMonthSelector(); // Atualizar seletor de mês
                
                // Se temos dados, selecionar o primeiro mês disponível
                const months = Object.keys(excelData);
                if (months.length > 0) {
                    selectMonth(months[0]);
                }
            } catch (error) {
                console.error("Erro ao carregar dados do localStorage:", error);
                localStorage.removeItem("excelChartData"); // Limpar dados inválidos
                showInitialMessage();
            }
        } else {
             showInitialMessage();
        }
    }

    function showInitialMessage() {
        document.getElementById("status-message").textContent = "Importe um arquivo Excel para visualizar os dados.";
        document.getElementById("status-message").style.display = "block";
        // Limpar KPIs e gráficos
        updateKPIs(null);
        updateChart(null);
        updateDonutChart(null);
        updateResultadosTable(null);
        updatePlataformasTable(null);
        updateFinanceiro(null);
    }
    
    // Função para processar o arquivo Excel
    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                
                // Processar dados do Excel
                processExcelData(workbook);
                
                // Limpar input de arquivo
                event.target.value = "";
            } catch (error) {
                console.error("Erro ao processar arquivo:", error);
                alert("Erro ao processar o arquivo. Verifique o formato e tente novamente.");
                showInitialMessage(); // Resetar para estado inicial em caso de erro
            }
        };
        reader.onerror = function(error) {
             console.error("Erro ao ler arquivo:", error);
             alert("Erro ao ler o arquivo selecionado.");
             showInitialMessage();
        };
        reader.readAsArrayBuffer(file);
    }
    
    // Função para processar dados do Excel
    function processExcelData(workbook) {
        const processedData = {};
        let firstMonth = null;
        
        workbook.SheetNames.forEach(sheetName => {
            // Verificar se o nome da folha corresponde ao formato de mês
            if (/^(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\d{2}$/i.test(sheetName)) {
                if (!firstMonth) firstMonth = sheetName; // Guardar o primeiro mês válido
                const worksheet = workbook.Sheets[sheetName];
                
                // Converter folha para array JSON, especificando o intervalo para dados diários
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    range: `A${CONFIG.START_DATA_ROW_INDEX + 1}:Z${CONFIG.END_DATA_ROW_INDEX + 1}`,
                    header: 1,
                    defval: null // Usar null para células vazias
                });
                
                // Extrair cabeçalhos da linha especificada
                const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
                const headers = [];
                for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: CONFIG.HEADER_ROW_INDEX, c: C });
                    const cell = worksheet[cellAddress];
                    headers[C] = cell ? cell.v : undefined;
                }
                
                // Processar dados diários para as colunas necessárias
                const processedSheetData = jsonData.map(rowArray => {
                    const row = Array.isArray(rowArray) ? rowArray : Object.values(rowArray);
                    // Garantir que temos um array e o comprimento esperado
                    if (!Array.isArray(row)) return null; 
                    return {
                        // Usar nullish coalescing para tratar undefined/null
                        dia: row[COL_DIA_INDEX] ?? null,
                        ganhos: row[COL_GANHOS_INDEX] ?? null,
                        percentual: row[COL_PERCENTUAL_INDEX] ?? null
                    };
                }).filter(row => row && row.dia !== null); // Filtrar linhas inválidas ou sem dia
                console.log("Processed Sheet Data for " + sheetName + ":", processedSheetData);
                
                // Extrair valores específicos das células para KPIs
                const totalDepositadoCell = worksheet[CONFIG.CELL_TOTAL_DEPOSITADO];
                const percentualMedioCell = worksheet[CONFIG.CELL_PERCENTUAL_MEDIO];
                const projecao30DiasCell = worksheet[CONFIG.CELL_PROJECAO_30_DIAS];
                
                // Usar .v para valor, .w para texto formatado (se disponível e preferível)
                const totalDepositado = totalDepositadoCell ? (totalDepositadoCell.v ?? 0) : 0;
                const percentualMedio = percentualMedioCell ? (percentualMedioCell.v ?? 0) : 0;
                const projecao30Dias = projecao30DiasCell ? (projecao30DiasCell.v ?? 0) : 0;

                // Extrair dados de depósitos diários
                const dailyDeposits = [];
                for (let i = CONFIG.START_DATA_ROW_INDEX; i <= CONFIG.END_DATA_ROW_INDEX; i++) {
                    const diaCell = worksheet[XLSX.utils.encode_cell({ r: i, c: COL_DIA_INDEX })];
                    const depositoCell = worksheet[XLSX.utils.encode_cell({ r: i, c: COL_DEPOSITOS_INDEX })];
                    
                    const dia = diaCell ? diaCell.v : null;
                    const deposito = depositoCell ? (depositoCell.v ?? 0) : 0;

                    if (dia !== null) {
                        dailyDeposits.push({ dia: dia, deposito: deposito });
                    }
                }
                
                // Extrair dados de plataformas das linhas especificadas
                const plataformasData = [];
                CONFIG.PLATAFORMAS_RANGES.forEach(range => {
                    for (let i = range.start; i <= range.end; i++) {
                        const diaCell = worksheet[XLSX.utils.encode_cell({ r: i, c: PLATAFORMAS_COL_DIA_INDEX })];
                        const plataformaCell = worksheet[XLSX.utils.encode_cell({ r: i, c: PLATAFORMAS_COL_PLATAFORMA_INDEX })];
                        const ganhosCell = worksheet[XLSX.utils.encode_cell({ r: i, c: PLATAFORMAS_COL_GANHOS_INDEX })];
                        const percentualCell = worksheet[XLSX.utils.encode_cell({ r: i, c: PLATAFORMAS_COL_PERCENTUAL_INDEX })];
                        
                        const dia = diaCell ? diaCell.v : null;
                        const plataforma = plataformaCell ? plataformaCell.v : null;
                        const ganhos = ganhosCell ? (ganhosCell.v ?? 0) : 0;
                        const percentual = percentualCell ? (percentualCell.v ?? 0) : 0;
                        
                        // Filtrar linhas indesejadas (cabeçalhos, dados inválidos, etc.)
                        const diaNumber = parseInt(dia);
                        const ganhosNumber = parseFloat(ganhos);
                        const isValidData = dia !== null && 
                                          plataforma !== null && 
                                          !isNaN(diaNumber) && // Dia deve ser um número válido
                                          diaNumber >= 1 && // Dia deve ser >= 1 (remover 0.01, 0, etc.)
                                          Number.isInteger(diaNumber) && // Dia deve ser um número inteiro
                                          plataforma !== "PLATAFORMAS" && // Remover linhas de cabeçalho
                                          dia !== "%" && // Remover linha com símbolo %
                                          dia !== "DATA" && // Remover linha com texto DATA
                                          !isNaN(ganhosNumber) && // Ganhos deve ser um número válido
                                          ganhosNumber !== 0; // Ganhos deve ser diferente de zero (maior ou menor que 0)
                        
                        // Só adicionar se tiver dados válidos
                        if (isValidData) {
                            plataformasData.push({
                                dia: dia,
                                plataforma: plataforma,
                                ganhos: ganhos,
                                percentual: percentual
                            });
                        }
                    }
                });
                
                // Calcular métricas adicionais (ex: Total de Ganhos, dados para donut)
                const additionalMetrics = calculateAdditionalMetrics(processedSheetData, worksheet);
                
                processedData[sheetName] = {
                    // rawWorksheet: worksheet, // Opcional: guardar a folha crua se necessário
                    headers: headers,
                       data: processedSheetData,
                    plataformasData: plataformasData, // Adicionar dados de plataformas
                    metrics: {
                           totalDepositado: totalDepositado,
                    percentualMedio: percentualMedio,
                    projecao30Dias: projecao30Dias,
                    dailyDeposits: dailyDeposits,
                        totalGanhos: additionalMetrics.totalGanhos,
                        plataformas: additionalMetrics.plataformas // Para o gráfico de rosca
                    }
                };
            }
        });
        
        // Verificar se algum dado foi processado
        if (Object.keys(processedData).length === 0) {
            alert("Nenhuma folha com nome de mês válido (ex: JAN24, FEV24) foi encontrada no arquivo.");
            showInitialMessage();
            return;
        }

        // Armazenar dados processados
        excelData = processedData;
        
        // Salvar no localStorage para persistência
        try {
            localStorage.setItem("excelChartData", JSON.stringify(processedData));
        } catch (error) {
            console.error("Erro ao salvar no localStorage:", error);
            alert("Não foi possível salvar os dados localmente. O dashboard funcionará, mas os dados não serão mantidos.");
        }
        updateMonthTabs();
        updateMeusResultadosMonthSelector(); // Atualizar seletor de mês
        
        // Selecionar o primeiro mês disponível
        if (firstMonth) {
            selectMonth(firstMonth);
        }
    }
    
    // Calcular métricas adicionais (Total Ganhos e dados para gráfico de rosca)
    function calculateAdditionalMetrics(data, worksheet) {
        let totalGanhos = 0;
        let plataformas = {}; // Usado para o gráfico de rosca
        
        data.forEach(row => {
            // Calcular Total de Ganhos
            const ganhosNum = parseFloat(row.ganhos);
            if (!isNaN(ganhosNum)) {
                totalGanhos += ganhosNum;
            }
        });
        
        // Extrair dados específicos das células C67/I67/E67, C111/I111/E111 e C155/I155/E155 para o gráfico de rosca
        if (worksheet) {
            const plataformasCells = [
                { row: 66, nameCol: 2, valueCol: 8, percentCol: 4 }, // C67, I67, E67 (0-indexed: 66, 2, 8, 4)
                { row: 110, nameCol: 2, valueCol: 8, percentCol: 4 }, // C111, I111, E111 (0-indexed: 110, 2, 8, 4)
                { row: 154, nameCol: 2, valueCol: 8, percentCol: 4 }  // C155, I155, E155 (0-indexed: 154, 2, 8, 4)
            ];
            
            plataformasCells.forEach(cellInfo => {
                const plataformaCell = worksheet[XLSX.utils.encode_cell({ r: cellInfo.row, c: cellInfo.nameCol })];
                const ganhosCell = worksheet[XLSX.utils.encode_cell({ r: cellInfo.row, c: cellInfo.valueCol })];
                
                const plataforma = plataformaCell ? plataformaCell.v : null;
                const ganhos = ganhosCell ? (ganhosCell.v ?? 0) : 0;
                
                if (plataforma && ganhos !== 0) {
                    plataformas[plataforma] = { ganhos: ganhos };
                }
            });
        }
        
        // Se não conseguiu extrair dados das células específicas, usar dados simulados
        if (Object.keys(plataformas).length === 0) {
            data.forEach(row => {
                // Simular dados de plataforma para o gráfico de rosca (usando o dia como chave)
                const plataforma = `Plataforma ${row.dia}`; 
                if (!plataformas[plataforma]) {
                    plataformas[plataforma] = { ganhos: 0 };
                }
                const ganhosNum = parseFloat(row.ganhos);
                if (!isNaN(ganhosNum)) {
                    plataformas[plataforma].ganhos += ganhosNum;
                }
            });
        }
        
        return {
            totalGanhos: totalGanhos,
            plataformas: plataformas
        };
    }
    
    // Função para atualizar as abas de mês
    function updateMonthTabs() {
        const monthTabsContainer = document.getElementById("month-tabs");
        monthTabsContainer.innerHTML = ""; // Limpar abas existentes
        
        const selectedYear = document.getElementById("year-select").value;
        const months = getMonthsForSelectedYear(selectedYear);
        
        if (months.length === 0) {
            // Não mostrar abas se não houver dados
            return;
        }
        
        months.forEach(month => {
            const button = document.createElement("button");
            button.className = "month-tab";
            button.textContent = month;
            button.dataset.month = month; // Adicionar data attribute para referência
            button.addEventListener("click", () => selectMonth(month));
            monthTabsContainer.appendChild(button);
        });
        
        // Atualizar o filtro de ano
        updateYearFilter();
        
        // Se há meses disponíveis, selecionar o primeiro
        if (months.length > 0) {
            selectMonth(months[0]);
        }
    }
    
    // Função para selecionar um mês
    function selectMonth(month) {
        if (!excelData || !excelData[month]) {
             console.warn(`Dados para o mês ${month} não encontrados.`);
             // Poderia mostrar uma mensagem para o usuário aqui
             return; 
        }
        currentMonth = month;
        
        // Atualizar classes ativas nas abas de mês
        document.querySelectorAll(".month-tab").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.month === month);
        });
        
        // Atualizar KPIs
        updateKPIs(month);
        
        // Atualizar gráficos
        updateChart(month);
        updateDonutChart(month);
        
        // Atualizar tabelas
        updateResultadosTable(month);
        updatePlataformasTable(month); // Atualiza a tabela na seção "Análise de Plataformas"
        
        // Atualizar financeiro
        updateFinanceiro(month);
    }
    
    // Função para atualizar os KPIs
    function updateKPIs(month) {
        const kpiData = month ? excelData[month] : null;
        
        if (!kpiData || !kpiData.metrics) {
            document.getElementById("total-depositado").textContent = formatCurrency(0);
            document.getElementById("total-ganhos").textContent = formatCurrency(0);
            document.getElementById("percentual-medio").textContent = formatPercentage(0, true); // Passar true para formatar 0 como 0,00%
            document.getElementById("projecao-30-dias").textContent = formatCurrency(0);
            // Limpar detalhes dos KPIs
            updateKPIDetails("deposito", [], "ganhos");
            updateKPIDetails("ganhos", [], "ganhos");
            updateKPIDetails("percentual", [], "percentual");
            return;
        }
        
        const metrics = kpiData.metrics;
        const dailyData = kpiData.data || [];
        
        document.getElementById("total-depositado").textContent = formatCurrency(metrics.totalDepositado);
        updateTotalDepositadoDetails(metrics.dailyDeposits);
        document.getElementById("total-ganhos").textContent = formatCurrency(metrics.totalGanhos);
        // Usar o valor lido da célula J12 para Percentual Médio
        document.getElementById("percentual-medio").textContent = formatPercentage(metrics.percentualMedio, true);
        document.getElementById("projecao-30-dias").textContent = formatCurrency(metrics.projecao30Dias);
        
        // Atualizar detalhes dos KPIs com dados diários
        updateKPIDetails("deposito", dailyData, "ganhos"); // Detalhe de depósito mostra ganhos diários
        updateKPIDetails("ganhos", dailyData, "ganhos"); // Detalhe de ganhos mostra ganhos diários
        updateKPIDetails("percentual", dailyData, "percentual"); // Detalhe de percentual mostra percentual diário
    }
    
    // Função para atualizar detalhes dos KPIs (agora com dados diários)
    function updateKPIDetails(type, dailyData, valueKey) {
        const detailsContainer = document.getElementById(`${type}-details`);
        if (!detailsContainer) return; // Verificar se o container existe
        detailsContainer.innerHTML = ""; // Limpar conteúdo anterior
        // Resetar altura para permitir cálculo correto ao reabrir
        detailsContainer.style.maxHeight = "0px"; 

        
        if (!dailyData || dailyData.length === 0) {
            const p = document.createElement("p");
            p.textContent = "Sem dados detalhados.";
            p.style.padding = "10px";
            detailsContainer.appendChild(p);
            return;
        }
        
        const table = document.createElement("table");
        table.className = "kpi-details-table";
        
        // Cabeçalho
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        
        // Cabeçalhos: Dia e Valor (Ganhos ou Percentual)

        let valueHeader = "Ganhos"; // Default
        if (valueKey === "percentual") {
            valueHeader = "Percentual";
        } else if (type === "deposito") { // Check if it's the deposito details section
            valueHeader = "Deposito"; // Use "Deposito" as requested
        }
        const headers = ["Dia", valueHeader];
        headers.forEach(headerText => {
            const th = document.createElement("th");
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Corpo
        const tbody = document.createElement("tbody");
        
        dailyData.forEach(row => {
            // Ignorar linhas onde o valor relevante é nulo
            if (row[valueKey] === null || row.dia === null) return;

            const tableRow = document.createElement("tr");
            
            // Célula Dia
            const diaCell = document.createElement("td");
            diaCell.textContent = row.dia; // Usar o valor da coluna "dia"
            tableRow.appendChild(diaCell);
            
            // Célula Valor (Ganhos ou Percentual)
            const valueCell = document.createElement("td");
            const value = row[valueKey];
            valueCell.textContent = valueKey === "percentual" 
                ? formatPercentage(value, true) // Passar true para formatar corretamente
                : formatCurrency(value);
            tableRow.appendChild(valueCell);
            
            tbody.appendChild(tableRow);
        });
        
        // Verificar se alguma linha foi adicionada ao tbody
        if (tbody.rows.length === 0) {
             const p = document.createElement("p");
             p.textContent = "Sem dados detalhados para exibir.";
             p.style.padding = "10px";
             detailsContainer.appendChild(p);
        } else {
             table.appendChild(tbody);
             detailsContainer.appendChild(table);
        }
    }
    
    // Função para agregar dados por mês
function aggregateDataByMonth() {
    if (!excelData || Object.keys(excelData).length === 0) {
        return { labels: [], ganhosData: [], percentualData: [] };
    }
    
    const monthlyData = {};
    const monthOrder = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

    // Obter o ano selecionado no filtro
    const selectedYear = document.getElementById("year-select").value;
    
    // Filtrar meses baseado no ano selecionado
    let availableMonths = Object.keys(excelData);
    if (selectedYear !== "all") {
        availableMonths = availableMonths.filter(monthName => {
            const yearMatch = monthName.match(/\d{2}$/);
            return yearMatch && yearMatch[0] === selectedYear;
        });
    }

    // Ordenar meses disponíveis
    const sortedMonths = availableMonths.sort((a, b) => {
        const [monthA, yearA] = [a.substring(0, 3), parseInt(a.substring(3))];
        const [monthB, yearB] = [b.substring(0, 3), parseInt(b.substring(3))];
        if (yearA !== yearB) return yearA - yearB;
        return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    if (sortedMonths.length === 0) {
        return { labels: [], ganhosData: [], percentualData: [] };
    }

    // Preencher dados para os meses disponíveis
    sortedMonths.forEach(monthKey => {
        const monthData = excelData[monthKey];
        if (monthData && monthData.metrics) {
            monthlyData[monthKey] = {
                ganhos: monthData.metrics.totalGanhos,
                percentual: monthData.metrics.percentualMedio
            };
        } else {
            // Mês ausente, preencher com 0
            monthlyData[monthKey] = {
                ganhos: 0,
                percentual: 0
            };
        }
    });
    
    const labels = Object.keys(monthlyData);
    const ganhosData = labels.map(month => monthlyData[month].ganhos);
    const percentualData = labels.map(month => monthlyData[month].percentual);
    
    return { labels, ganhosData, percentualData };
    }
    
    // Função para agregar dados diários em semanais
    function aggregateDailyToWeekly(dailyData) {
        const weeklyData = [];
        let currentWeek = [];
        let weekNumber = 1;
        
        dailyData.forEach((dayData, index) => {
            if (dayData.dia !== null) {
                currentWeek.push(dayData);
                
                // Agrupar por semanas de 7 dias ou quando chegamos ao final dos dados
                if (currentWeek.length === 7 || index === dailyData.length - 1) {
                    const weekGanhos = currentWeek.reduce((sum, day) => sum + (day.ganhos || 0), 0);
                    const weekPercentual = currentWeek.reduce((sum, day) => sum + (day.percentual || 0), 0);
                    console.log(`Semana ${weekNumber}: Ganhos = ${weekGanhos}, Percentual = ${weekPercentual}`);
                    
                    weeklyData.push({
                        week: `Semana ${weekNumber}`,
                        ganhos: weekGanhos,
                        percentual: weekPercentual
                    });
                    
                    currentWeek = [];
                    weekNumber++;
                }
            }
        });
        
        return weeklyData;
    }
    
    // Função para atualizar o gráfico principal
    function updateChart(month) {
        const canvas = document.getElementById("monthlyChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const statusMessage = document.getElementById("status-message");
        
        // Destruir gráfico existente se houver
        if (mainChart) {
            mainChart.destroy();
            mainChart = null;
        }

        let labels, ganhosData, percentualData, chartTitle;
        
        // Verificar o período selecionado
        if (currentPeriod === "month") {
            // Mostrar dados agregados por mês
            const aggregatedData = aggregateDataByMonth();
            labels = aggregatedData.labels; // Não inverte a ordem
            ganhosData = aggregatedData.ganhosData; // Não inverte a ordem
            percentualData = aggregatedData.percentualData; // Não inverte a ordem
            chartTitle = "Dados Mensais";
            
            if (labels.length === 0) {
                statusMessage.textContent = "Sem dados mensais para exibir.";
                statusMessage.style.display = "block";
                canvas.style.display = "none";
                return;
            }
        } else if (currentPeriod === "week") {
            // Mostrar dados semanais do mês selecionado
            if (!month || !excelData[month] || !excelData[month].data || excelData[month].data.length === 0) {
                statusMessage.textContent = month ? `Sem dados para ${month}.` : "Importe um arquivo Excel.";
                statusMessage.style.display = "block";
                canvas.style.display = "none";
                return;
            }
            
            const sheetData = excelData[month].data;
            const weeklyData = aggregateDailyToWeekly(sheetData);
            labels = weeklyData.map(week => week.week);
            ganhosData = weeklyData.map(week => week.ganhos);
            percentualData = weeklyData.map(week => week.percentual);
            chartTitle = `Dados Semanais para ${month}`;
        } else {
            // Mostrar dados diários do mês selecionado
            if (!month || !excelData[month] || !excelData[month].data || excelData[month].data.length === 0) {
                statusMessage.textContent = month ? `Sem dados para ${month}.` : "Importe um arquivo Excel.";
                statusMessage.style.display = "block";
                canvas.style.display = "none";
                return;
            }
            
            const sheetData = excelData[month].data;
            labels = sheetData.map(row => row.dia).filter(dia => dia !== null);
            ganhosData = sheetData.filter(row => row.dia !== null).map(row => row.ganhos ?? 0);
            percentualData = sheetData.filter(row => row.dia !== null).map(row => row.percentual ?? 0);
            chartTitle = `Dados para ${month}`;
        }
        
        // Ocultar mensagem de status e mostrar canvas
        statusMessage.style.display = "none";
        canvas.style.display = "block";
        
        // Criar novo gráfico
        mainChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Ganhos",
                        data: ganhosData,
                        backgroundColor: "rgba(54, 162, 235, 0.7)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1,
                        yAxisID: "yGanhos"
                    },
                    {
                        label: "Porcentagem",
                        data: percentualData,
                        backgroundColor: "rgba(255, 99, 132, 0.7)",
                        borderColor: "rgba(255, 99, 132, 1)",
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false,
                        type: "line",
                        yAxisID: "yPercentual"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: currentPeriod === "month" ? "Mês" : currentPeriod === "week" ? "Semana" : "Dia"
                        }
                    },
                    yGanhos: {
                        type: "linear",
                        position: "left",
                        title: {
                            display: true,
                            text: "Ganhos"
                        },
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    yPercentual: {
                        type: "linear",
                        position: "right",
                        title: {
                            display: true,
                            text: "Porcentagem"
                        },
                        ticks: {
                            callback: function(value) {
                                return formatPercentage(value, true);
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const item = tooltipItems[0];
                                if (currentPeriod === "day") {
                                    // Para o período "dia", o título deve mostrar o dia e a porcentagem correspondente
                                    const dayLabel = item.label;
                                    const dayIndex = item.dataIndex;
                                    const dayData = excelData[currentMonth].data[dayIndex];
                                    const percentualValueDay = dayData ? dayData.percentual : 0;
                                    return `Dia: ${dayLabel} - Porcentagem: ${formatPercentage(percentualValueDay, true)}`;
                                } else if (currentPeriod === "week") {
                                    // Para o período "semana", o título deve mostrar a semana e a porcentagem média
                                    const weekLabel = item.label;
                                    const weekIndex = item.dataIndex;
                                    const sheetData = excelData[currentMonth].data;
                                    const weeklyData = aggregateDailyToWeekly(sheetData);
                                    const percentualValueWeek = weeklyData[weekIndex] ? weeklyData[weekIndex].percentual : 0;
                                    return `${weekLabel} - Porcentagem: ${formatPercentage(percentualValueWeek, true)}`;
                                } else {
                                    // Para outros períodos (mês), o título deve mostrar o mês e a porcentagem média
                                    const monthLabel = item.label;
                                    let percentualValue = 0;
                                    if (excelData[monthLabel] && excelData[monthLabel].metrics) {
                                        percentualValue = excelData[monthLabel].metrics.percentualMedio;
                                    }
                                    return `Mês: ${monthLabel} - Porcentagem: ${formatPercentage(percentualValue, true)}`;
                                }
                            },
                            label: function(context) {
                                let label = context.dataset.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed.y !== null) {
                                    if (context.dataset.label === "Ganhos") {
                                        label += formatCurrency(context.parsed.y);
                                    } else if (context.dataset.label === "Porcentagem") {
                                        // Aqui está o problema principal - vamos buscar a percentagem correta
                                        if (currentPeriod === "day" && currentMonth && excelData[currentMonth]) {
                                            // Para o período "dia", buscar a percentagem específica do dia
                                            const dayIndex = context.dataIndex;
                                            const dayData = excelData[currentMonth].data[dayIndex];
                                            if (dayData && dayData.percentual !== null) {
                                                label += formatPercentage(dayData.percentual, true);
                                            } else {
                                                label += formatPercentage(0, true);
                                            }
                                        } else if (currentPeriod === "week" && currentMonth && excelData[currentMonth]) {
                                            // Para o período "semana", buscar a percentagem específica da semana
                                            const weekIndex = context.dataIndex;
                                            const sheetData = excelData[currentMonth].data;
            const weeklyData = aggregateDailyToWeekly(sheetData);
                                            const weekData = weeklyData[weekIndex];
                                            if (weekData && weekData.percentual !== null) {
                                                label += formatPercentage(weekData.percentual, true);
                                            } else {
                                                label += formatPercentage(0, true);
                                            }
                                        } else {
                                            // Para outros períodos, usar o valor do gráfico
                                            label += formatPercentage(context.parsed.y, true);
                                        }
                                    }
                                }
                                return label;
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: chartTitle
                    }
                }
            }
        });
    }
    
    // Função para atualizar o gráfico de rosca
    function updateDonutChart(month) {
        const canvas = document.getElementById("donut-chart");
         if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const legendContainer = document.getElementById("donut-legend");
        legendContainer.innerHTML = ""; // Limpar legenda
        
         // Destruir gráfico existente se houver
        if (donutChart) {
            donutChart.destroy();
            donutChart = null;
        }

        // Verificar se temos dados para este mês
        if (!month || !excelData[month] || !excelData[month].metrics || !excelData[month].metrics.plataformas || Object.keys(excelData[month].metrics.plataformas).length === 0) {
            legendContainer.innerHTML = "<p>Sem dados de plataforma.</p>";
            canvas.style.display = "none"; // Esconder canvas
            return;
        }
        
        canvas.style.display = "block"; // Mostrar canvas
        const plataformas = excelData[month].metrics.plataformas;
        const labels = Object.keys(plataformas);
        const data = labels.map(label => plataformas[label].ganhos);
        const totalGanhosPlataformas = data.reduce((sum, val) => sum + val, 0);
        
        const backgroundColors = [
            "#4caf50",
            "#2196f3",
            "#ff9800",
            "#9c27b0",
            "#e91e63",
            "#00bcd4",
            "#f44336",
            "#3f51b5",
            "#cddc39",
            "#009688",
        ];
        
       
        // Criar novo gráfico
        donutChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, data.length),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "70%", // Ajustar o tamanho do buraco
                plugins: {
                    legend: {
                        display: false // Desabilitar legenda padrão
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed !== null) {
                                    label += formatCurrency(context.parsed);
                                    if (totalGanhosPlataformas > 0) {
                                        const percentage = (context.parsed / totalGanhosPlataformas * 100).toFixed(1);
                                        label += ` (${percentage}%)`;
                                    }
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // Criar legenda personalizada
        labels.forEach((label, index) => {
            const legendItem = document.createElement("div");
            legendItem.className = "legend-item";
            
            const colorBox = document.createElement("span");
            colorBox.className = "color-box";
            colorBox.style.backgroundColor = backgroundColors[index % backgroundColors.length];
            
            const text = document.createElement("span");
            const value = data[index];
            const percentage = totalGanhosPlataformas > 0 ? (value / totalGanhosPlataformas * 100).toFixed(1) : 0;
            text.textContent = `${label}: ${formatCurrency(value)} (${percentage}%)`;
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(text);
            legendContainer.appendChild(legendItem);
        });
    }

    // Função para atualizar a tabela de Resultados Diários
    function updateResultadosTable(month) {
        const tableBody = document.getElementById("resultados-table-body");
        if (!tableBody) return;
        tableBody.innerHTML = ""; // Limpar tabela

        if (!month || !excelData[month] || !excelData[month].data || excelData[month].data.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3;
            cell.textContent = "Sem dados para exibir.";
            cell.style.textAlign = "center";
            return;
        }

        const data = excelData[month].data;
        data.forEach(rowData => {
             if (rowData.dia === null) return; // Não adicionar linha se o dia for nulo

            const row = tableBody.insertRow();
            const diaCell = row.insertCell();
            const ganhosCell = row.insertCell();
            const percentualCell = row.insertCell();

            diaCell.textContent = rowData.dia;
            ganhosCell.textContent = formatCurrency(rowData.ganhos);
            percentualCell.textContent = formatPercentage(rowData.percentual, true);

            const ganhosValue = parseFloat(rowData.ganhos);
            if (!isNaN(ganhosValue)) {
                if (ganhosValue > 0) {
                    ganhosCell.style.color = "limegreen";
                    ganhosCell.style.fontWeight = "bold";
                } else if (ganhosValue < 0) {
                    ganhosCell.style.color = "red";
                    ganhosCell.style.fontWeight = "bold";
                }
            }

            const percentualValue = parseFloat(rowData.percentual);
            if (!isNaN(percentualValue)) {
                if (percentualValue > 0) {
                    percentualCell.style.color = "limegreen";
                    percentualCell.style.fontWeight = "bold";
                } else if (percentualValue < 0) {
                    percentualCell.style.color = "red";
                    percentualCell.style.fontWeight = "bold";
                }
            }
        });
    }

    // Função para atualizar a tabela de Análise de Plataformas
    function updatePlataformasTable(month) {
        const tableBody = document.getElementById("plataformas-table-body");
         if (!tableBody) return;
        tableBody.innerHTML = ""; // Limpar tabela

        if (!month || !excelData[month] || !excelData[month].plataformasData || excelData[month].plataformasData.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4; // Agora são 4 colunas: Dia, Plataforma, Ganhos, Percentual
            cell.textContent = "Sem dados de plataforma para exibir.";
            cell.style.textAlign = "center";
            return;
        }

        const plataformasData = excelData[month].plataformasData;
        
        // Classificar os dados primeiro por dia (numérico) e depois por plataforma (alfabético)
        const sortedData = [...plataformasData].sort((a, b) => {
            // Primeiro critério: classificar por dia (numérico)
            const diaA = parseInt(a.dia) || 0;
            const diaB = parseInt(b.dia) || 0;
            
            if (diaA !== diaB) {
                return diaA - diaB; // Classificação numérica crescente
            }
            
            // Segundo critério: se os dias forem iguais, classificar por plataforma (alfabético)
            const plataformaA = String(a.plataforma).toLowerCase();
            const plataformaB = String(b.plataforma).toLowerCase();
            return plataformaA.localeCompare(plataformaB);
        });

        sortedData.forEach(item => {
            const row = tableBody.insertRow();
            
            // Coluna Dia
            const diaCell = row.insertCell();
            diaCell.textContent = item.dia;
            
            // Coluna Plataforma
            const plataformaCell = row.insertCell();
            plataformaCell.textContent = item.plataforma;
            
            // Coluna Ganhos
            const ganhosCell = row.insertCell();
            ganhosCell.textContent = formatCurrency(item.ganhos);
            
            // Coluna Percentual
            const percentualCell = row.insertCell();
            percentualCell.textContent = formatPercentage(item.percentual, true);
            
            // Aplicar cores baseadas nos valores
            const ganhosValue = parseFloat(item.ganhos);
            if (!isNaN(ganhosValue)) {
                if (ganhosValue > 0) {
                    ganhosCell.style.color = "limegreen";
                    ganhosCell.style.fontWeight = "bold";
                } else if (ganhosValue < 0) {
                    ganhosCell.style.color = "red";
                    ganhosCell.style.fontWeight = "bold";
                }
            }

            const percentualValue = parseFloat(item.percentual);
            if (!isNaN(percentualValue)) {
                if (percentualValue > 0) {
                    percentualCell.style.color = "limegreen";
                    percentualCell.style.fontWeight = "bold";
                } else if (percentualValue < 0) {
                    percentualCell.style.color = "red";
                    percentualCell.style.fontWeight = "bold";
                }
            }
        });
    }

    // Função para atualizar a seção Financeiro
    function updateFinanceiro(month) {
        const totalInvestidoEl = document.getElementById("total-investido");
        const retornoTotalEl = document.getElementById("retorno-total");
        const roiEl = document.getElementById("roi");

        if (!totalInvestidoEl || !retornoTotalEl || !roiEl) return;

        if (!month || !excelData[month] || !excelData[month].metrics) {
            totalInvestidoEl.textContent = formatCurrency(0);
            retornoTotalEl.textContent = formatCurrency(0);
            roiEl.textContent = formatPercentage(0, true);
            updateFinanceiroSemestres();
            updateFinanceiroAnual();
            return;
        }

        const metrics = excelData[month].metrics;
        const totalInvestido = metrics.totalDepositado; // Usar Total Depositado como Total Investido
        const retornoTotal = metrics.totalGanhos;
        const roi = totalInvestido !== 0 ? (retornoTotal / totalInvestido) : 0;

        totalInvestidoEl.textContent = formatCurrency(totalInvestido);
        retornoTotalEl.textContent = formatCurrency(retornoTotal);
        roiEl.textContent = formatPercentage(roi, true);
        
        // Atualizar os novos cartões
        updateFinanceiroSemestres();
        updateFinanceiroAnual();
    }

    // Função para atualizar os cartões de semestres
    function updateFinanceiroSemestres() {
        updateFinanceiroSemestre1();
        updateFinanceiroSemestre2();
    }

    // Função para atualizar o primeiro semestre
    function updateFinanceiroSemestre1() {
        const totalInvestidoEl = document.getElementById("total-investido-semestre1");
        const retornoTotalEl = document.getElementById("retorno-total-semestre1");
        const roiEl = document.getElementById("roi-semestre1");

        if (!totalInvestidoEl || !retornoTotalEl || !roiEl) return;

        // Obter ano selecionado no filtro financeiro
        const yearSelectFinanceiro = document.getElementById("year-select-financeiro");
        const selectedYear = yearSelectFinanceiro ? yearSelectFinanceiro.value : "all";
        
        // Definir meses do primeiro semestre baseado no ano selecionado
        let mesesPrimeiroSemestre = [];
        if (selectedYear === "all") {
            // Se "Todos" estiver selecionado, usar todos os anos disponíveis
            const allMonths = Object.keys(excelData);
            mesesPrimeiroSemestre = allMonths.filter(month => {
                const monthName = month.substring(0, 3);
                return ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN"].includes(monthName);
            });
        } else {
            // Usar apenas o ano selecionado
            mesesPrimeiroSemestre = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN"].map(month => month + selectedYear);
        }

        // Calcular total investido e retorno total
        let totalInvestidoSemestre = 0;
        let retornoTotalSemestre = 0;
        
        if (selectedYear === "all") {
            // Quando "Todos" for selecionado, somar valores de cada ano
            const anosProcessados = new Set();
            const anosDisponiveis = new Set(Object.keys(excelData).map(monthName => monthName.substring(3)));
            for (const ano of Array.from(anosDisponiveis).sort()) {
                const primeiroMesDoAno = [`JAN${ano}`, `FEV${ano}`, `MAR${ano}`, `ABR${ano}`, `MAI${ano}`, `JUN${ano}`].find(m => excelData[m]);
                if (primeiroMesDoAno && excelData[primeiroMesDoAno] && excelData[primeiroMesDoAno].metrics) {
                    totalInvestidoSemestre += excelData[primeiroMesDoAno].metrics.totalDepositado;
                }
            }
            for (const sheetName of mesesPrimeiroSemestre) {
                if (excelData[sheetName] && excelData[sheetName].metrics) {
                    retornoTotalSemestre += excelData[sheetName].metrics.totalGanhos;
                }
            }
        } else {
            // Para um ano específico, usar o primeiro mês disponível para total investido
            for (const mes of mesesPrimeiroSemestre) {
                if (excelData[mes] && excelData[mes].metrics) {
                    if (totalInvestidoSemestre === 0) {
                        totalInvestidoSemestre = excelData[mes].metrics.totalDepositado;
                    }
                    retornoTotalSemestre += excelData[mes].metrics.totalGanhos;
                }
            }
        }

        const roi = totalInvestidoSemestre !== 0 ? (retornoTotalSemestre / totalInvestidoSemestre) : 0;

        totalInvestidoEl.textContent = formatCurrency(totalInvestidoSemestre);
        retornoTotalEl.textContent = formatCurrency(retornoTotalSemestre);
        roiEl.textContent = formatPercentage(roi, true);
    }

    // Função para exportar dados
    function exportData(format) {
        if (!currentMonth || !excelData[currentMonth] || !excelData[currentMonth].data) {
            alert("Não há dados para exportar para o mês selecionado.");
            return;
        }

        const monthData = excelData[currentMonth].data;
        const monthName = currentMonth;

        if (format === "excel") {
            // Criar um novo workbook
            const wb = XLSX.utils.book_new();

            // Adicionar dados de cada mês como uma folha separada
            Object.keys(excelData).forEach(sheetMonth => {
                const sheetData = excelData[sheetMonth].data;
                if (sheetData && sheetData.length > 0) {
                    // Preparar dados para a folha (cabeçalhos + linhas)
                    const dataToExport = [
                        ["Dia", "Ganhos", "Porcentagem"], // Cabeçalhos
                        ...sheetData.map(row => [
                            row.dia,
                            row.ganhos,
                            row.percentual
                        ])
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
                    
                    // Formatar colunas (opcional)
                    ws["!cols"] = [
                        { wch: 10 }, // Largura da coluna Dia
                        { wch: 15, z: "R$ #,##0.00" }, // Largura e formato da coluna Ganhos
                        { wch: 15, z: "0.00%" } // Largura e formato da coluna Porcentagem
                    ];

                    XLSX.utils.book_append_sheet(wb, ws, sheetMonth);
                }
            });
            
            // Verificar se alguma folha foi adicionada
            if (wb.SheetNames.length === 0) {
                alert("Não há dados válidos em nenhuma folha para exportar.");
                return;
            }

            // Exportar o arquivo
            try {
                 XLSX.writeFile(wb, `dashboard_export_${Date.now()}.xlsx`);
            } catch (error) {
                 console.error("Erro ao exportar para Excel:", error);
                 alert("Ocorreu um erro ao tentar exportar para Excel.");
            }
           

        } else if (format === "csv") {
            // Preparar dados para CSV (apenas mês atual)
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += ["Dia", "Ganhos", "Porcentagem"].join(",") + "\n"; // Cabeçalhos

            monthData.forEach(row => {
                const rowArray = [
                    `"${String(row.dia ?? "").replace(/"/g, "\"\"")}"`, // Tratar dia (string ou num)
                    row.ganhos ?? "", // Usar valor ou vazio
                    row.percentual ?? "" // Usar valor ou vazio
                ];
                csvContent += rowArray.join(",") + "\n";
            });

            // Criar link e fazer download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `dashboard_export_${monthName}_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Função para atualizar os detalhes do Total Depositado
    function updateTotalDepositadoDetails(dailyDeposits) {
        const detailsContainer = document.getElementById("total-depositado-details-content");
        detailsContainer.innerHTML = ""; // Limpar conteúdo anterior

        if (!dailyDeposits || dailyDeposits.length === 0) {
            detailsContainer.innerHTML = "<p>Nenhum dado de depósito diário disponível.</p>";
            return;
        }

        const table = document.createElement("table");
        table.classList.add("details-table");
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Dia</th>
                    <th>Depósito</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector("tbody");

        dailyDeposits.forEach(item => {
            const row = tbody.insertRow();
            const diaCell = row.insertCell();
            const depositoCell = row.insertCell();
            diaCell.textContent = item.dia;
            depositoCell.textContent = formatCurrency(item.deposito);
        });

        detailsContainer.appendChild(table);
    }

    // Função para atualizar o filtro de ano
    function updateYearFilter() {
        const yearSelect = document.getElementById("year-select");
        const yearSelectFinanceiro = document.getElementById("year-select-financeiro");
        const currentValue = yearSelect.value;
        const currentValueFinanceiro = yearSelectFinanceiro ? yearSelectFinanceiro.value : "all";
        
        // Limpar opções existentes exceto "Todos"
        yearSelect.innerHTML = '<option value="all">Todos</option>';
        if (yearSelectFinanceiro) {
            yearSelectFinanceiro.innerHTML = '<option value="all">Todos</option>';
        }
        
        // Extrair anos únicos dos nomes dos meses
        const years = new Set();
        Object.keys(excelData).forEach(monthName => {
            // Extrair os últimos 2 dígitos como ano (ex: JAN24 -> 24)
            const yearMatch = monthName.match(/\d{2}$/);
            if (yearMatch) {
                years.add(yearMatch[0]);
            }
        });
        
        // Adicionar opções de ano para ambos os filtros
        Array.from(years).sort().forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = `20${year}`;
            yearSelect.appendChild(option);
            
            if (yearSelectFinanceiro) {
                const optionFinanceiro = document.createElement("option");
                optionFinanceiro.value = year;
                optionFinanceiro.textContent = `20${year}`;
                yearSelectFinanceiro.appendChild(optionFinanceiro);
            }
        });
        
        // Restaurar valor selecionado se ainda existir
        if (currentValue && Array.from(yearSelect.options).some(opt => opt.value === currentValue)) {
            yearSelect.value = currentValue;
        }
        if (yearSelectFinanceiro && currentValueFinanceiro && Array.from(yearSelectFinanceiro.options).some(opt => opt.value === currentValueFinanceiro)) {
            yearSelectFinanceiro.value = currentValueFinanceiro;
        }
    }

    // Função para obter meses do ano selecionado
    function getMonthsForSelectedYear(selectedYear) {
        if (selectedYear === "all") {
            return Object.keys(excelData);
        }
        
        return Object.keys(excelData).filter(monthName => {
            const yearMatch = monthName.match(/\d{2}$/);
            return yearMatch && yearMatch[0] === selectedYear;
        });
    }

    // Função para agregar dados diários em semanais
    function aggregateDailyToWeekly(dailyData) {
        const weeklyData = [];
        let currentWeekGains = 0;
        let currentWeekPercentage = 0;
        let daysInWeek = 0;

        dailyData.forEach((day, index) => {
            currentWeekGains += day.ganhos || 0;
            currentWeekPercentage += day.percentual || 0;
            daysInWeek++;

            // Se for o 7º dia da semana ou o último dia do mês
            if (daysInWeek === 7 || index === dailyData.length - 1) {
                weeklyData.push({
                    week: `Semana ${Math.ceil((index + 1) / 7)}`,
                    ganhos: currentWeekGains,
                    percentual: currentWeekPercentage // Usar soma total em vez de média
                });
                currentWeekGains = 0;
                currentWeekPercentage = 0;
                daysInWeek = 0;
            }
        });
        return weeklyData;
    }



    // Função para atualizar o segundo semestre
    function updateFinanceiroSemestre2() {
        const totalInvestidoEl = document.getElementById("total-investido-semestre2");
        const retornoTotalEl = document.getElementById("retorno-total-semestre2");
        const roiEl = document.getElementById("roi-semestre2");

        if (!totalInvestidoEl || !retornoTotalEl || !roiEl) return;

        // Obter ano selecionado no filtro financeiro
        const yearSelectFinanceiro = document.getElementById("year-select-financeiro");
        const selectedYear = yearSelectFinanceiro ? yearSelectFinanceiro.value : "all";
        
        // Definir meses do segundo semestre baseado no ano selecionado
        let mesesSegundoSemestre = [];
        if (selectedYear === "all") {
            // Se "Todos" estiver selecionado, usar todos os anos disponíveis
            const allMonths = Object.keys(excelData);
            mesesSegundoSemestre = allMonths.filter(month => {
                const monthName = month.substring(0, 3);
                return ["JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].includes(monthName);
            });
        } else {
            // Usar apenas o ano selecionado
            mesesSegundoSemestre = ["JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map(month => month + selectedYear);
        }

        // Calcular total investido e retorno total
        let totalInvestidoSemestre = 0;
        let retornoTotalSemestre = 0;
        
        if (selectedYear === "all") {
            // Quando "Todos" for selecionado, somar valores de cada ano
            const anosProcessados = new Set();
            const anosDisponiveis = new Set(Object.keys(excelData).map(monthName => monthName.substring(3)));
            for (const ano of Array.from(anosDisponiveis).sort()) {
                const primeiroMesSegundoSemestreDoAno = [`JUL${ano}`, `AGO${ano}`, `SET${ano}`, `OUT${ano}`, `NOV${ano}`, `DEZ${ano}`].find(m => excelData[m]);
                if (primeiroMesSegundoSemestreDoAno && excelData[primeiroMesSegundoSemestreDoAno] && excelData[primeiroMesSegundoSemestreDoAno].metrics) {
                    totalInvestidoSemestre += excelData[primeiroMesSegundoSemestreDoAno].metrics.totalDepositado;
                }
            }
            for (const sheetName of mesesSegundoSemestre) {
                if (excelData[sheetName] && excelData[sheetName].metrics) {
                    retornoTotalSemestre += excelData[sheetName].metrics.totalGanhos;
                }
            }
        } else {
            // Para um ano específico, usar o primeiro mês disponível para total investido
            for (const mes of mesesSegundoSemestre) {
                if (excelData[mes] && excelData[mes].metrics) {
                    if (totalInvestidoSemestre === 0) {
                        totalInvestidoSemestre = excelData[mes].metrics.totalDepositado;
                    }
                    retornoTotalSemestre += excelData[mes].metrics.totalGanhos;
                }
            }
        }

        const roi = totalInvestidoSemestre !== 0 ? (retornoTotalSemestre / totalInvestidoSemestre) : 0;

        totalInvestidoEl.textContent = formatCurrency(totalInvestidoSemestre);
        retornoTotalEl.textContent = formatCurrency(retornoTotalSemestre);
        roiEl.textContent = formatPercentage(roi, true);
    }

    // Função para atualizar o resumo anual
    function updateFinanceiroAnual() {
        const totalInvestidoEl = document.getElementById("total-investido-anual");
        const retornoTotalEl = document.getElementById("retorno-total-anual");
        const roiEl = document.getElementById("roi-anual");

        if (!totalInvestidoEl || !retornoTotalEl || !roiEl) return;

        // Obter ano selecionado no filtro financeiro
        const yearSelectFinanceiro = document.getElementById("year-select-financeiro");
        const selectedYear = yearSelectFinanceiro ? yearSelectFinanceiro.value : "all";
        
        // Definir meses do ano baseado no ano selecionado
        let mesesAno = [];
        if (selectedYear === "all") {
            // Se "Todos" estiver selecionado, usar todos os meses disponíveis
            mesesAno = Object.keys(excelData);
        } else {
            // Usar apenas o ano selecionado
            mesesAno = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map(month => month + selectedYear);
        }

        // Calcular total investido e retorno total
        let totalInvestidoAno = 0;
        let retornoTotalAno = 0;
        
        if (selectedYear === "all") {
            // Quando "Todos" for selecionado, somar valores de cada ano
            const anosDisponiveis = new Set(Object.keys(excelData).map(monthName => monthName.substring(3)));
            for (const ano of Array.from(anosDisponiveis).sort()) {
                const primeiroMesDoAno = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map(m => m + ano).find(m => excelData[m]);
                if (primeiroMesDoAno && excelData[primeiroMesDoAno] && excelData[primeiroMesDoAno].metrics) {
                    totalInvestidoAno += excelData[primeiroMesDoAno].metrics.totalDepositado;
                }
            }
            for (const sheetName of mesesAno) {
                if (excelData[sheetName] && excelData[sheetName].metrics) {
                    retornoTotalAno += excelData[sheetName].metrics.totalGanhos;
                }
            }
        } else {
            // Para um ano específico, usar o primeiro mês disponível para total investido
            for (const mes of mesesAno) {
                if (excelData[mes] && excelData[mes].metrics) {
                    if (totalInvestidoAno === 0) {
                        totalInvestidoAno = excelData[mes].metrics.totalDepositado;
                    }
                    retornoTotalAno += excelData[mes].metrics.totalGanhos;
                }
            }
        }

        const roi = totalInvestidoAno !== 0 ? (retornoTotalAno / totalInvestidoAno) : 0;

        totalInvestidoEl.textContent = formatCurrency(totalInvestidoAno);
        retornoTotalEl.textContent = formatCurrency(retornoTotalAno);
        roiEl.textContent = formatPercentage(roi, true);
    }
});


    // Função para calcular "Meus Resultados"
    function calcularMeusResultados() {
        const valorInvestidoText = document.getElementById("valor-investido").value;
        const mesSelecionado = document.getElementById("mes-selecionado").value;
        
        // Converter valor formatado para número
        const valorInvestido = parseFloat(valorInvestidoText.replace(/[R$\s.]/g, '').replace(',', '.'));
        
        if (!valorInvestido || valorInvestido <= 0) {
            alert("Por favor, insira um valor investido válido.");
            return;
        }
        
        if (!mesSelecionado) {
            alert("Por favor, selecione um mês válido.");
            return;
        }
        
        // Verificar se há dados importados
        if (!excelData || Object.keys(excelData).length === 0) {
            alert("Por favor, importe dados do Excel primeiro.");
            return;
        }
        
        // Obter o ano do mês selecionado
        const anoSelecionado = mesSelecionado.substring(3); // Últimos 2 dígitos
        const mesNome = mesSelecionado.substring(0, 3); // Primeiros 3 caracteres
        
        // Mapear nomes dos meses para números
        const mesesNomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        const mesNumero = mesesNomes.indexOf(mesNome) + 1;
        const mesAtual = new Date().getMonth() + 1; // Mês atual (1-12)
        const anoAtual = new Date().getFullYear().toString().substring(2);
        
        let totalDepositado = 0;
        let totalGanhos = 0;
        
        // Somar depósitos e ganhos do mês selecionado até o mês atual
        const mesesParaCalcular = [];
        
        // Se o ano selecionado é o atual, calcular até o mês atual
        if (anoSelecionado === anoAtual) {
            for (let mes = mesNumero; mes <= mesAtual; mes++) {
                const nomeDoMes = mesesNomes[mes - 1] + anoSelecionado;
                mesesParaCalcular.push(nomeDoMes);
            }
        } else {
            // Se é um ano anterior, calcular até dezembro daquele ano
            for (let mes = mesNumero; mes <= 12; mes++) {
                const nomeDoMes = mesesNomes[mes - 1] + anoSelecionado;
                mesesParaCalcular.push(nomeDoMes);
            }
            
            // Adicionar meses do ano atual até o mês atual
            if (parseInt(anoSelecionado) < parseInt(anoAtual)) {
                for (let mes = 1; mes <= mesAtual; mes++) {
                    const nomeDoMes = mesesNomes[mes - 1] + anoAtual;
                    mesesParaCalcular.push(nomeDoMes);
                }
            }
        }
        
        // Calcular totais
        for (const nomeDoMes of mesesParaCalcular) {
            if (excelData[nomeDoMes] && excelData[nomeDoMes].metrics) {
                // Para depósitos, usar apenas o primeiro mês (valor total acumulado)
                if (totalDepositado === 0) {
                    totalDepositado = excelData[nomeDoMes].metrics.totalDepositado;
                }
                // Para ganhos, somar todos os meses
                totalGanhos += excelData[nomeDoMes].metrics.totalGanhos;
            }
        }
        
        // Calcular ROI baseado nos dados históricos
        const roiHistorico = totalDepositado > 0 ? (totalGanhos / totalDepositado) : 0;
        
        // Calcular resultado financeiro: valor investido * ROI - 30%
        const resultadoFinanceiro = valorInvestido * roiHistorico * 0.7; // Subtraindo 30%
        
        // Calcular ROI do resultado financeiro em relação ao valor investido
        const roiFinal = valorInvestido > 0 ? (resultadoFinanceiro / valorInvestido) : 0;
        
        // Exibir resultados
        document.getElementById("resultado-financeiro").textContent = formatCurrency(resultadoFinanceiro);
        document.getElementById("roi-final").textContent = formatPercentage(roiFinal, true);
        
        console.log("Cálculo realizado:", {
            valorInvestido,
            mesSelecionado,
            totalDepositado,
            totalGanhos,
            roiHistorico,
            resultadoFinanceiro,
            roiFinal
        });
    }


    // Função para formatar campo de moeda
    function formatarCampoMoeda(event) {
        // Só formatar no evento blur (quando sair do campo)
        if (event.type === 'blur') {
            let valor = event.target.value;
            
            // Remover caracteres não numéricos exceto vírgula e ponto
            valor = valor.replace(/[^\d,.]/g, '');
            
            // Se o valor estiver vazio, não fazer nada
            if (!valor) {
                return;
            }
            
            // Substituir vírgula por ponto para conversão
            valor = valor.replace(',', '.');
            
            // Converter para número
            let numero = parseFloat(valor);
            
            if (!isNaN(numero) && numero > 0) {
                // Formatar como moeda brasileira
                event.target.value = numero.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                });
            }
        }
        // No evento input, não fazer nada - permitir digitação livre
    }
    
    // Função para atualizar o seletor de mês em "Meus Resultados"
    function updateMeusResultadosMonthSelector() {
        const mesSelector = document.getElementById("mes-selecionado");
        if (!mesSelector) return;
        
        // Limpar opções existentes
        mesSelector.innerHTML = '';
        
        // Se não há dados, mostrar mensagem
        if (!excelData || Object.keys(excelData).length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Importe dados do Excel primeiro";
            option.disabled = true;
            mesSelector.appendChild(option);
            return;
        }
        
        // Obter todos os meses disponíveis e ordenar
        const mesesDisponiveis = Object.keys(excelData).sort((a, b) => {
            // Extrair ano e mês para ordenação correta
            const anoA = a.substring(3);
            const anoB = b.substring(3);
            const mesA = a.substring(0, 3);
            const mesB = b.substring(0, 3);
            
            // Mapear nomes dos meses para números
            const mesesNomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
            const mesNumA = mesesNomes.indexOf(mesA);
            const mesNumB = mesesNomes.indexOf(mesB);
            
            // Ordenar por ano primeiro, depois por mês
            if (anoA !== anoB) {
                return anoA.localeCompare(anoB);
            }
            return mesNumA - mesNumB;
        });
        
        // Mapear nomes dos meses para exibição
        const mesesNomesCompletos = {
            "JAN": "Janeiro",
            "FEV": "Fevereiro", 
            "MAR": "Março",
            "ABR": "Abril",
            "MAI": "Maio",
            "JUN": "Junho",
            "JUL": "Julho",
            "AGO": "Agosto",
            "SET": "Setembro",
            "OUT": "Outubro",
            "NOV": "Novembro",
            "DEZ": "Dezembro"
        };
        
        // Adicionar opções para cada mês disponível
        mesesDisponiveis.forEach(mes => {
            const option = document.createElement("option");
            option.value = mes;
            
            const mesNome = mes.substring(0, 3);
            const ano = mes.substring(3);
            const nomeCompleto = mesesNomesCompletos[mesNome] || mesNome;
            
            option.textContent = `${nomeCompleto} 20${ano}`;
            mesSelector.appendChild(option);
        });
        
        // Selecionar o primeiro mês por padrão
        if (mesesDisponiveis.length > 0) {
            mesSelector.value = mesesDisponiveis[0];
        }
    }


// Logout functionality
document.addEventListener("DOMContentLoaded", function () {
    // Check permissions and show/hide elements
    const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '{}');
    const userRole = localStorage.getItem('userRole');
    
    // Display username
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        const username = localStorage.getItem('username') || 'Usuário';
        usernameDisplay.textContent = username;
    }

    // Show/hide menu items based on permissions
    const configMenu = document.getElementById('menu-configuracoes');
    if (configMenu) {
        configMenu.style.display = userPermissions.can_access_config ? 'block' : 'none';
    }

    // Show admin menu only for admins
    const adminMenu = document.getElementById('menu-admin');
    if (adminMenu) {
        adminMenu.style.display = userRole === 'admin' ? 'block' : 'none';
    }

    // Show/hide export button based on permissions
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.style.display = userPermissions.can_export ? 'inline-flex' : 'none';
    }

    // Hide financial section if no permission
    const financialMenu = document.getElementById('menu-financeiro');
    if (financialMenu && !userPermissions.can_view_financial) {
        financialMenu.style.display = 'none';
    }

    // Hide analytics sections if no permission
    const analyticsMenu = document.getElementById('menu-analise-plataformas');
    if (analyticsMenu && !userPermissions.can_view_analytics) {
        analyticsMenu.style.display = 'none';
    }

    // Admin menu click handler
    if (adminMenu) {
        adminMenu.addEventListener('click', function() {
            window.location.href = 'admin.html';
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('menu-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Tem certeza que deseja sair?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('username');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userPermissions');
                window.location.href = 'login.html';
            }
        });
    }
});



        // Change Password menu item click
        document.getElementById("menu-change-password").addEventListener("click", function() {
            document.getElementById("change-password-modal").style.display = "block";
        });

        // Close Change Password modal
        document.getElementById("close-change-password-modal").addEventListener("click", function() {
            document.getElementById("change-password-modal").style.display = "none";
        });

        // Cancel Change Password
        document.getElementById("cancel-change-password").addEventListener("click", function() {
            document.getElementById("change-password-modal").style.display = "none";
        });

        // Change Password form submission
        document.getElementById("change-password-form").addEventListener("submit", async function(e) {
            e.preventDefault();

            const currentPassword = document.getElementById("current-password").value;
            const newPassword = document.getElementById("new-password").value;
            const confirmNewPassword = document.getElementById("confirm-new-password").value;
            const username = localStorage.getItem("username"); // Get username from localStorage

            if (newPassword !== confirmNewPassword) {
                alert("A nova senha e a confirmação da nova senha não coincidem.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/change_password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: username,
                        old_password: currentPassword,
                        new_password: newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    document.getElementById("change-password-modal").style.display = "none";
                    document.getElementById("change-password-form").reset();
                } else {
                    alert(`Erro: ${data.message}`);
                }
            } catch (error) {
                console.error("Erro ao alterar senha:", error);
                alert("Ocorreu um erro ao tentar alterar a senha.");
            }
        });


