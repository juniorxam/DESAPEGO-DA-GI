// =========================================
// VARIÁVEIS GLOBAIS E ESTRUTURA DE DADOS
// =========================================

let dados = {
    itens: [],
    consignatarios: [],
    compradores: [],
    vendas: [],
    bazares: [],
    config: {
        comissaoPadrao: 30, // %
        descontoMaximo: 10  // %
    }
};

let chartVendasInstance = null;
let chartConsignatariosInstance = null;
const STORAGE_KEY = 'bazarPlusData';

// =========================================
// FUNÇÕES DE UTILIDADE
// =========================================

/**
 * Carrega os dados do LocalStorage ou inicializa com dados de exemplo se não houver.
 */
function carregarDados() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        dados = JSON.parse(storedData);
        // Garante que a estrutura de crédito existe
        dados.consignatarios = dados.consignatarios.map(c => ({
            ...c,
            credito: c.credito || 0,
            historicoCredito: c.historicoCredito || []
        }));
    } else {
        // Dados de exemplo para iniciar
        dados.consignatarios = [
            { id: 1, nome: "Ana Silva", email: "ana@exemplo.com", telefone: "11999998888", credito: 50.00, historicoCredito: [{ data: new Date().toISOString().substring(0, 10), tipo: "Ajuste", descricao: "Crédito Inicial", valor: 50.00 }] },
            { id: 2, nome: "Bruno Costa", email: "bruno@exemplo.com", telefone: "11988887777", credito: 0.00, historicoCredito: [] }
        ];
        dados.compradores = [
            { id: 1, nome: "Carla Oliveira", email: "carla@exemplo.com", telefone: "11977776666" },
            { id: 2, nome: "Daniel Rocha", email: "daniel@exemplo.com", telefone: "11966665555" }
        ];
        dados.bazares = [
            { id: 1, nome: "Bazar de Estreia", dataInicio: new Date().toISOString().substring(0, 10), dataFim: "", status: "Ativo" }
        ];
        salvarDados();
    }

    renderizarTodasTabelas();
    atualizarSelects();
    renderizarDashboard();
}

/**
 * Salva a estrutura de dados atual no LocalStorage.
 */
function salvarDados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

/**
 * Formata um número para o formato de moeda Real (R$).
 * @param {number} valor - O valor a ser formatado.
 * @returns {string} O valor formatado como moeda.
 */
function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Exibe uma mensagem de notificação (toast).
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} type - O tipo de notificação ('success' ou 'error').
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Força o reflow para aplicar a transição
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

/**
 * Abre a aba de navegação selecionada.
 */
function openTab(evt, tabName) {
    // Declara todas as variáveis
    let i, tabcontent, tablinks;

    // Obtém todos os elementos com class="tab-content" e os esconde
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].classList.remove("active");
    }

    // Obtém todos os elementos com class="tab-button" e remove a classe "active"
    tablinks = document.getElementsByClassName("tab-button");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Mostra a aba atual e adiciona a classe "active" ao botão que a abriu
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.className += " active";

    // Re-renderiza o dashboard ao abrir a aba
    if (tabName === 'dashboard') {
        renderizarDashboard();
    } else if (tabName === 'relatorios') {
        // Seleciona o primeiro consignatário e gera o relatório
        const select = document.getElementById('relatorioConsignatario');
        if (select.options.length > 1) {
            select.selectedIndex = 1;
            gerarRelatorioConsignatario();
        } else {
            document.getElementById('relatorioOutput').innerHTML = '<p class="text-muted">Nenhum consignatário cadastrado.</p>';
        }
    }
}

/**
 * Aplica/alterna o tema escuro.
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    // Destrói e recria gráficos para aplicar novas cores
    if (document.querySelector('.tab-content.active').id === 'dashboard') {
        renderizarDashboard();
    }
}

// =========================================
// FUNÇÕES DE MANIPULAÇÃO DO DOM / RENDERIZAÇÃO
// =========================================

/**
 * Atualiza todos os <select> dinâmicos na página.
 */
function atualizarSelects() {
    const selects = [
        { id: 'itemConsignatario', data: dados.consignatarios, prefix: 'C' },
        { id: 'vendaComprador', data: dados.compradores, prefix: 'B' },
        { id: 'relatorioConsignatario', data: dados.consignatarios, prefix: 'C', includeDefault: true },
    ];

    selects.forEach(s => {
        const select = document.getElementById(s.id);
        if (select) {
            select.innerHTML = '';
            if (s.includeDefault) {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `Selecione um ${s.id.includes('Consignatario') ? 'Consignatário' : 'Comprador'}`;
                select.appendChild(defaultOption);
            }
            s.data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${s.prefix}${item.id.toString().padStart(3, '0')} - ${item.nome}`;
                select.appendChild(option);
            });
        }
    });

    // Selects de Bazar (Itens, Vendas, Relatório)
    ['itemBazar', 'vendaBazar', 'relatorioBazar'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const oldValue = select.value; // Mantém o valor selecionado
            select.innerHTML = '';
            
            if (id === 'relatorioBazar') {
                const optionAll = document.createElement('option');
                optionAll.value = '';
                optionAll.textContent = 'Todos os Bazares';
                select.appendChild(optionAll);
            }
            
            dados.bazares.forEach(bazar => {
                const option = document.createElement('option');
                option.value = bazar.id;
                option.textContent = `${bazar.nome} (${bazar.status})`;
                select.appendChild(option);
            });

            // Tenta restaurar o valor, se for válido
            if (Array.from(select.options).some(opt => opt.value == oldValue)) {
                 select.value = oldValue;
            } else if (id === 'vendaBazar' && dados.bazares.length > 0) {
                 // Para Venda, seleciona o primeiro Ativo por padrão, se houver
                const ativo = dados.bazares.find(b => b.status === 'Ativo');
                select.value = ativo ? ativo.id : dados.bazares[0].id;
            }
        }
    });

    // Adiciona o listener de busca de item na aba de Vendas
    const vendaItemInput = document.getElementById('vendaItem');
    if (vendaItemInput) {
        vendaItemInput.oninput = buscarItemParaVenda;
    }
}

/**
 * Renderiza todas as tabelas de dados.
 */
function renderizarTodasTabelas() {
    renderizarTabelaItens();
    renderizarTabelaConsignatarios();
    renderizarTabelaCompradores();
    renderizarTabelaBazares();
    renderizarTabelaVendas();
}

/**
 * Renderiza a tabela de Itens.
 */
function renderizarTabelaItens() {
    const tbody = document.getElementById('itensTable').querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const filtroTexto = document.getElementById('filtroItens').value.toLowerCase();
    const filtroStatus = document.getElementById('filtroStatus').value;

    const itensFiltrados = dados.itens.filter(item => {
        const consignatario = dados.consignatarios.find(c => c.id === item.consignatarioId) || { nome: 'Desconhecido' };
        
        const textoMatch = !filtroTexto || 
                           item.codigo.toLowerCase().includes(filtroTexto) ||
                           item.descricao.toLowerCase().includes(filtroTexto) ||
                           consignatario.nome.toLowerCase().includes(filtroTexto);
                           
        const statusMatch = !filtroStatus || item.status === filtroStatus;

        return textoMatch && statusMatch;
    });
    
    itensFiltrados.forEach(item => {
        const consignatario = dados.consignatarios.find(c => c.id === item.consignatarioId) || { nome: 'Desconhecido' };
        const bazar = dados.bazares.find(b => b.id === item.bazarEntradaId) || { nome: 'N/A' };
        
        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td>${item.codigo}</td>
            <td>${item.descricao}</td>
            <td>${formatarMoeda(item.precoSugerido)}</td>
            <td>${consignatario.nome}</td>
            <td>${bazar.nome}</td>
            <td><span class="status-badge ${item.status.replace(' ', '')}">${item.status}</span></td>
            <td>
                <button onclick="editarItem(${item.id})" class="btn btn-warning action-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="removerItem(${item.id})" class="btn btn-danger action-btn" title="Remover"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });
}

/**
 * Renderiza a tabela de Vendas.
 */
function renderizarTabelaVendas() {
    const tbody = document.getElementById('vendasTable').querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Ordena as vendas por data decrescente
    const vendasOrdenadas = [...dados.vendas].sort((a, b) => new Date(b.data) - new Date(a.data));

    vendasOrdenadas.forEach(venda => {
        const item = dados.itens.find(i => i.id === venda.itemId);
        const consignatario = dados.consignatarios.find(c => c.id === (item ? item.consignatarioId : null)) || { nome: 'N/A' };
        const comprador = dados.compradores.find(b => b.id === venda.compradorId) || { nome: 'N/A' };

        const comissao = venda.valorVenda * (venda.comissaoPercentual / 100);
        const repasse = venda.valorVenda - comissao;
        
        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td>${venda.id}</td>
            <td>${venda.data}</td>
            <td>${item ? item.codigo : 'Item Deletado'}</td>
            <td>${consignatario.nome}</td>
            <td>${comprador.nome}</td>
            <td>${formatarMoeda(venda.valorVenda)}</td>
            <td>${formatarMoeda(comissao)} (${venda.comissaoPercentual}%)</td>
            <td>${formatarMoeda(repasse)}</td>
            <td>
                <button onclick="reverterVenda(${venda.id})" class="btn btn-danger action-btn" title="Reverter Venda"><i class="fas fa-undo"></i></button>
            </td>
        `;
    });
}

/**
 * Renderiza a tabela de Consignatários.
 */
function renderizarTabelaConsignatarios() {
    const tbody = document.getElementById('consignatariosTable').querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    dados.consignatarios.forEach(c => {
        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td>C${c.id.toString().padStart(3, '0')}</td>
            <td>${c.nome}</td>
            <td>${c.email || 'N/A'}</td>
            <td>${c.telefone || 'N/A'}</td>
            <td><span style="font-weight: 700; color: ${c.credito >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatarMoeda(c.credito)}</span></td>
            <td>
                <button onclick="editarConsignatario(${c.id})" class="btn btn-warning action-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="removerConsignatario(${c.id})" class="btn btn-danger action-btn" title="Remover"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });
}

/**
 * Renderiza a tabela de Compradores.
 */
function renderizarTabelaCompradores() {
    const tbody = document.getElementById('compradoresTable').querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    dados.compradores.forEach(b => {
        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td>B${b.id.toString().padStart(3, '0')}</td>
            <td>${b.nome}</td>
            <td>${b.email || 'N/A'}</td>
            <td>${b.telefone || 'N/A'}</td>
            <td>
                <button onclick="editarComprador(${b.id})" class="btn btn-warning action-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="removerComprador(${b.id})" class="btn btn-danger action-btn" title="Remover"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });
}

/**
 * Renderiza a tabela de Bazares.
 */
function renderizarTabelaBazares() {
    const tbody = document.getElementById('bazaresTable').querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    dados.bazares.forEach(bazar => {
        const vendasBazar = dados.vendas.filter(v => v.bazarId === bazar.id);
        const totalVendas = vendasBazar.reduce((sum, v) => sum + v.valorVenda, 0);

        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td>${bazar.id}</td>
            <td>${bazar.nome}</td>
            <td>${bazar.dataInicio}</td>
            <td>${bazar.dataFim || 'Em andamento'}</td>
            <td><span class="status-badge ${bazar.status}">${bazar.status}</span></td>
            <td>${formatarMoeda(totalVendas)}</td>
            <td>
                <button onclick="editarBazar(${bazar.id})" class="btn btn-warning action-btn" title="Editar"><i class="fas fa-edit"></i></button>
                <button onclick="removerBazar(${bazar.id})" class="btn btn-danger action-btn" title="Remover"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;
    });
}

// =========================================
// FUNÇÕES DE DASHBOARD
// =========================================

/**
 * Renderiza os dados e gráficos do Dashboard.
 */
function renderizarDashboard() {
    // 1. Cálculo das Estatísticas
    const totalArrecadado = dados.vendas.reduce((sum, v) => sum + v.valorVenda, 0);
    const totalComissao = dados.vendas.reduce((sum, v) => sum + (v.valorVenda * (v.comissaoPercentual / 100)), 0);
    const totalConsignado = totalArrecadado - totalComissao;
    const itensVendidos = dados.vendas.length;

    // 2. Atualiza os cards
    document.getElementById('totalArrecadado').textContent = formatarMoeda(totalArrecadado);
    document.getElementById('totalConsignado').textContent = formatarMoeda(totalConsignado);
    document.getElementById('totalComissao').textContent = formatarMoeda(totalComissao);
    document.getElementById('itensVendidos').textContent = itensVendidos.toString();

    // 3. Gráfico de Vendas por Mês
    const vendasPorMes = dados.vendas.reduce((acc, venda) => {
        const mesAno = venda.data.substring(0, 7); // YYYY-MM
        acc[mesAno] = (acc[mesAno] || 0) + venda.valorVenda;
        return acc;
    }, {});

    const labelsMes = Object.keys(vendasPorMes).sort();
    const dataMes = labelsMes.map(mes => vendasPorMes[mes]);
    
    // Converte YYYY-MM para MM/YYYY
    const labelsFormatadas = labelsMes.map(m => {
        const [ano, mes] = m.split('-');
        return `${mes}/${ano}`;
    });

    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim();
    const textMutedColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim();

    if (chartVendasInstance) {
        chartVendasInstance.destroy();
    }
    const ctxVendas = document.getElementById('vendasChart').getContext('2d');
    chartVendasInstance = new Chart(ctxVendas, {
        type: 'line',
        data: {
            labels: labelsFormatadas,
            datasets: [{
                label: 'Total Arrecadado (R$)',
                data: dataMes,
                backgroundColor: primaryColor + '40', // 40 = 25% opacidade
                borderColor: primaryColor,
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textMutedColor,
                        callback: function(value) { return formatarMoeda(value); }
                    },
                    grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color').trim() }
                },
                x: {
                    ticks: { color: textMutedColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    labels: { color: textMutedColor }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatarMoeda(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // 4. Gráfico de Vendas por Consignatário (Top 5)
    const vendasPorConsignatario = dados.vendas.reduce((acc, venda) => {
        const item = dados.itens.find(i => i.id === venda.itemId);
        const consignatarioId = item ? item.consignatarioId : 'deleted';
        acc[consignatarioId] = (acc[consignatarioId] || 0) + venda.valorVenda;
        return acc;
    }, {});
    
    const consignatarioStats = Object.keys(vendasPorConsignatario).map(id => {
        const consignatario = dados.consignatarios.find(c => c.id == id);
        return {
            nome: consignatario ? consignatario.nome : 'Item Deletado/Sem Consignatário',
            total: vendasPorConsignatario[id]
        };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    const labelsConsignatarios = consignatarioStats.map(s => s.nome);
    const dataConsignatarios = consignatarioStats.map(s => s.total);

    if (chartConsignatariosInstance) {
        chartConsignatariosInstance.destroy();
    }
    const ctxConsignatarios = document.getElementById('consignatariosChart').getContext('2d');
    chartConsignatariosInstance = new Chart(ctxConsignatarios, {
        type: 'bar',
        data: {
            labels: labelsConsignatarios,
            datasets: [{
                label: 'Total de Vendas (R$)',
                data: dataConsignatarios,
                backgroundColor: [primaryColor, '#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                borderColor: getComputedStyle(document.body).getPropertyValue('--card-bg').trim(),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Barras horizontais
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textMutedColor,
                        callback: function(value) { return formatarMoeda(value); }
                    },
                    grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color').trim() }
                },
                y: {
                    ticks: { color: textMutedColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.x !== null) {
                                label += formatarMoeda(context.parsed.x);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}


// =========================================
// FUNÇÕES DE ITENS
// =========================================

/**
 * Adiciona um novo item ou salva um item existente.
 */
function adicionarItem() {
    const id = document.getElementById('itemCodigo').dataset.id;
    const codigo = document.getElementById('itemCodigo').value.toUpperCase();
    const descricao = document.getElementById('itemDescricao').value;
    const precoSugerido = parseFloat(document.getElementById('itemPrecoSugerido').value);
    const consignatarioId = parseInt(document.getElementById('itemConsignatario').value);
    const bazarEntradaId = parseInt(document.getElementById('itemBazar').value);
    const status = document.getElementById('itemStatus').value;

    if (!codigo || !descricao || isNaN(precoSugerido) || precoSugerido <= 0 || !consignatarioId || !bazarEntradaId) {
        showToast('Preencha todos os campos obrigatórios e verifique o preço.', 'error');
        return;
    }
    
    // Verifica se o código já existe para outros itens
    const codigoExiste = dados.itens.some(item => item.codigo === codigo && item.id != id);
    if (codigoExiste) {
        showToast('O Código do Item já existe. Use um código único.', 'error');
        return;
    }

    if (id) {
        // EDIÇÃO
        const itemIndex = dados.itens.findIndex(i => i.id == id);
        if (itemIndex > -1) {
            dados.itens[itemIndex] = { ...dados.itens[itemIndex], codigo, descricao, precoSugerido, consignatarioId, bazarEntradaId, status };
            showToast('Item atualizado com sucesso!');
        }
    } else {
        // NOVO CADASTRO
        const novoId = dados.itens.length > 0 ? Math.max(...dados.itens.map(i => i.id)) + 1 : 1;
        const novoItem = { id: novoId, codigo, descricao, precoSugerido, consignatarioId, bazarEntradaId, status: 'Disponível', dataCadastro: new Date().toISOString().substring(0, 10) };
        dados.itens.push(novoItem);
        showToast('Item cadastrado com sucesso!');
    }

    salvarDados();
    renderizarTabelaItens();
    limparFormItem();
}

/**
 * Limpa o formulário de item e o prepara para um novo cadastro.
 */
function limparFormItem() {
    document.getElementById('itemCodigo').value = '';
    document.getElementById('itemCodigo').dataset.id = '';
    document.getElementById('itemDescricao').value = '';
    document.getElementById('itemPrecoSugerido').value = '';
    document.getElementById('itemStatus').value = 'Disponível';
    document.getElementById('itemStatus').disabled = true; // Status só pode ser alterado por venda/baixa
    document.querySelector('#itens button.btn-primary').innerHTML = '<i class="fas fa-plus"></i> Cadastrar Item (Ctrl+S)';
}

/**
 * Preenche o formulário para edição de um item.
 */
function editarItem(id) {
    const item = dados.itens.find(i => i.id === id);
    if (item) {
        document.getElementById('itemCodigo').value = item.codigo;
        document.getElementById('itemCodigo').dataset.id = item.id;
        document.getElementById('itemDescricao').value = item.descricao;
        document.getElementById('itemPrecoSugerido').value = item.precoSugerido;
        document.getElementById('itemConsignatario').value = item.consignatarioId;
        document.getElementById('itemBazar').value = item.bazarEntradaId;
        document.getElementById('itemStatus').value = item.status;
        document.getElementById('itemStatus').disabled = false; // Permite alteração manual do status
        document.querySelector('#itens button.btn-primary').innerHTML = '<i class="fas fa-save"></i> Salvar Item (Ctrl+S)';
        document.getElementById('itemCodigo').focus();
    }
}

/**
 * Remove um item.
 */
function removerItem(id) {
    if (confirm('Tem certeza que deseja remover este item? Todas as vendas associadas serão mantidas, mas o item ficará como "Deletado".')) {
        const item = dados.itens.find(i => i.id === id);
        
        // Verifica se o item foi vendido
        if (item.status === 'Vendido') {
            showToast('Não é possível remover um item vendido. Altere o status para Baixado se necessário.', 'error');
            return;
        }

        dados.itens = dados.itens.filter(i => i.id !== id);
        salvarDados();
        renderizarTabelaItens();
        showToast('Item removido com sucesso!');
    }
}

/**
 * Listener para filtro de itens.
 */
document.getElementById('filtroItens').addEventListener('input', renderizarTabelaItens);
document.getElementById('filtroStatus').addEventListener('change', renderizarTabelaItens);


// =========================================
// FUNÇÕES DE CONSIGNATÁRIOS
// =========================================

/**
 * Adiciona ou salva um Consignatário.
 */
function adicionarConsignatario() {
    const id = document.getElementById('consignatarioNome').dataset.id;
    const nome = document.getElementById('consignatarioNome').value;
    const email = document.getElementById('consignatarioEmail').value;
    const telefone = document.getElementById('consignatarioTelefone').value;

    if (!nome) {
        showToast('O nome do consignatário é obrigatório.', 'error');
        return;
    }

    if (id) {
        // EDIÇÃO
        const index = dados.consignatarios.findIndex(c => c.id == id);
        if (index > -1) {
            dados.consignatarios[index] = { ...dados.consignatarios[index], nome, email, telefone };
            showToast('Consignatário atualizado com sucesso!');
        }
    } else {
        // NOVO CADASTRO
        const novoId = dados.consignatarios.length > 0 ? Math.max(...dados.consignatarios.map(c => c.id)) + 1 : 1;
        const novoConsignatario = { id: novoId, nome, email, telefone, credito: 0, historicoCredito: [] };
        dados.consignatarios.push(novoConsignatario);
        showToast('Consignatário cadastrado com sucesso!');
    }

    salvarDados();
    renderizarTabelaConsignatarios();
    atualizarSelects();
    limparFormConsignatario();
}

/**
 * Limpa o formulário de Consignatário.
 */
function limparFormConsignatario() {
    document.getElementById('consignatarioNome').value = '';
    document.getElementById('consignatarioNome').dataset.id = '';
    document.getElementById('consignatarioEmail').value = '';
    document.getElementById('consignatarioTelefone').value = '';
    document.querySelector('#consignatarios button.btn-primary').innerHTML = '<i class="fas fa-user-tag"></i> Cadastrar Consignatário (Ctrl+S)';
}

/**
 * Preenche o formulário para edição de um Consignatário.
 */
function editarConsignatario(id) {
    const c = dados.consignatarios.find(c => c.id === id);
    if (c) {
        document.getElementById('consignatarioNome').value = c.nome;
        document.getElementById('consignatarioNome').dataset.id = c.id;
        document.getElementById('consignatarioEmail').value = c.email;
        document.getElementById('consignatarioTelefone').value = c.telefone;
        document.querySelector('#consignatarios button.btn-primary').innerHTML = '<i class="fas fa-save"></i> Salvar Consignatário (Ctrl+S)';
        document.getElementById('consignatarioNome').focus();
    }
}

/**
 * Remove um Consignatário.
 */
function removerConsignatario(id) {
    // Verifica se o consignatário tem itens ou vendas
    const hasItems = dados.itens.some(i => i.consignatarioId === id);
    const hasVendas = dados.vendas.some(v => {
        const item = dados.itens.find(i => i.id === v.itemId);
        return item && item.consignatarioId === id;
    });

    if (hasItems || hasVendas) {
        showToast('Não é possível remover este consignatário. Ele possui itens ou vendas associadas.', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja remover este consignatário?')) {
        dados.consignatarios = dados.consignatarios.filter(c => c.id !== id);
        salvarDados();
        renderizarTabelaConsignatarios();
        atualizarSelects();
        showToast('Consignatário removido com sucesso!');
    }
}


// =========================================
// FUNÇÕES DE COMPRADORES
// =========================================

/**
 * Adiciona ou salva um Comprador.
 */
function adicionarComprador() {
    const id = document.getElementById('compradorNome').dataset.id;
    const nome = document.getElementById('compradorNome').value;
    const email = document.getElementById('compradorEmail').value;
    const telefone = document.getElementById('compradorTelefone').value;

    if (!nome) {
        showToast('O nome do comprador é obrigatório.', 'error');
        return;
    }

    if (id) {
        // EDIÇÃO
        const index = dados.compradores.findIndex(b => b.id == id);
        if (index > -1) {
            dados.compradores[index] = { ...dados.compradores[index], nome, email, telefone };
            showToast('Comprador atualizado com sucesso!');
        }
    } else {
        // NOVO CADASTRO
        const novoId = dados.compradores.length > 0 ? Math.max(...dados.compradores.map(b => b.id)) + 1 : 1;
        const novoComprador = { id: novoId, nome, email, telefone };
        dados.compradores.push(novoComprador);
        showToast('Comprador cadastrado com sucesso!');
    }

    salvarDados();
    renderizarTabelaCompradores();
    atualizarSelects();
    limparFormComprador();
}

/**
 * Limpa o formulário de Comprador.
 */
function limparFormComprador() {
    document.getElementById('compradorNome').value = '';
    document.getElementById('compradorNome').dataset.id = '';
    document.getElementById('compradorEmail').value = '';
    document.getElementById('compradorTelefone').value = '';
    document.querySelector('#compradores button.btn-primary').innerHTML = '<i class="fas fa-shopping-cart"></i> Cadastrar Comprador (Ctrl+S)';
}

/**
 * Preenche o formulário para edição de um Comprador.
 */
function editarComprador(id) {
    const b = dados.compradores.find(b => b.id === id);
    if (b) {
        document.getElementById('compradorNome').value = b.nome;
        document.getElementById('compradorNome').dataset.id = b.id;
        document.getElementById('compradorEmail').value = b.email;
        document.getElementById('compradorTelefone').value = b.telefone;
        document.querySelector('#compradores button.btn-primary').innerHTML = '<i class="fas fa-save"></i> Salvar Comprador (Ctrl+S)';
        document.getElementById('compradorNome').focus();
    }
}

/**
 * Remove um Comprador.
 */
function removerComprador(id) {
    // Verifica se o comprador tem vendas
    const hasVendas = dados.vendas.some(v => v.compradorId === id);

    if (hasVendas) {
        showToast('Não é possível remover este comprador. Ele possui vendas associadas.', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja remover este comprador?')) {
        dados.compradores = dados.compradores.filter(b => b.id !== id);
        salvarDados();
        renderizarTabelaCompradores();
        atualizarSelects();
        showToast('Comprador removido com sucesso!');
    }
}


// =========================================
// FUNÇÕES DE BARES
// =========================================

/**
 * Cria ou salva um Bazar.
 */
function criarBazar() {
    const id = document.getElementById('bazarNome').dataset.id;
    const nome = document.getElementById('bazarNome').value;
    const dataInicio = document.getElementById('bazarDataInicio').value;
    const dataFim = document.getElementById('bazarDataFim').value;
    const status = document.getElementById('bazarStatus').value;

    if (!nome || !dataInicio) {
        showToast('O nome e a data de início do bazar são obrigatórios.', 'error');
        return;
    }

    if (id) {
        // EDIÇÃO
        const index = dados.bazares.findIndex(b => b.id == id);
        if (index > -1) {
            dados.bazares[index] = { ...dados.bazares[index], nome, dataInicio, dataFim, status };
            showToast('Bazar atualizado com sucesso!');
        }
    } else {
        // NOVO CADASTRO
        const novoId = dados.bazares.length > 0 ? Math.max(...dados.bazares.map(b => b.id)) + 1 : 1;
        const novoBazar = { id: novoId, nome, dataInicio, dataFim, status };
        dados.bazares.push(novoBazar);
        showToast('Bazar criado com sucesso!');
    }

    salvarDados();
    renderizarTabelaBazares();
    atualizarSelects();
    limparFormBazar();
}

/**
 * Limpa o formulário de Bazar.
 */
function limparFormBazar() {
    document.getElementById('bazarNome').value = '';
    document.getElementById('bazarNome').dataset.id = '';
    document.getElementById('bazarDataInicio').value = '';
    document.getElementById('bazarDataFim').value = '';
    document.getElementById('bazarStatus').value = 'Planejado';
    document.querySelector('#bazares button.btn-primary').innerHTML = '<i class="fas fa-calendar-plus"></i> Criar Bazar (Ctrl+S)';
}

/**
 * Preenche o formulário para edição de um Bazar.
 */
function editarBazar(id) {
    const bazar = dados.bazares.find(b => b.id === id);
    if (bazar) {
        document.getElementById('bazarNome').value = bazar.nome;
        document.getElementById('bazarNome').dataset.id = bazar.id;
        document.getElementById('bazarDataInicio').value = bazar.dataInicio;
        document.getElementById('bazarDataFim').value = bazar.dataFim;
        document.getElementById('bazarStatus').value = bazar.status;
        document.querySelector('#bazares button.btn-primary').innerHTML = '<i class="fas fa-save"></i> Salvar Bazar (Ctrl+S)';
        document.getElementById('bazarNome').focus();
    }
}

/**
 * Remove um Bazar.
 */
function removerBazar(id) {
    // Verifica se o bazar tem itens ou vendas associadas
    const hasItems = dados.itens.some(i => i.bazarEntradaId === id);
    const hasVendas = dados.vendas.some(v => v.bazarId === id);

    if (hasItems || hasVendas) {
        showToast('Não é possível remover este bazar. Ele possui itens ou vendas associadas.', 'error');
        return;
    }

    if (confirm('Tem certeza que deseja remover este bazar?')) {
        dados.bazares = dados.bazares.filter(b => b.id !== id);
        salvarDados();
        renderizarTabelaBazares();
        atualizarSelects();
        showToast('Bazar removido com sucesso!');
    }
}


// =========================================
// FUNÇÕES DE VENDAS
// =========================================

/**
 * Busca e exibe informações de um item no formulário de venda.
 */
function buscarItemParaVenda() {
    const codigo = document.getElementById('vendaItem').value.toUpperCase();
    const infoSpan = document.getElementById('item-info');
    infoSpan.innerHTML = '';
    infoSpan.dataset.itemId = '';

    if (codigo.length < 3) return;

    const item = dados.itens.find(i => i.codigo === codigo);
    if (!item) {
        infoSpan.innerHTML = '<span style="color: var(--danger);">Item não encontrado.</span>';
        document.getElementById('vendaPreco').value = '';
        return;
    }

    const consignatario = dados.consignatarios.find(c => c.id === item.consignatarioId) || { nome: 'N/A' };
    const config = dados.config;

    if (item.status === 'Vendido') {
        infoSpan.innerHTML = '<span style="color: var(--danger); font-weight: bold;">ITEM JÁ VENDIDO!</span>';
        document.getElementById('vendaPreco').value = '';
        return;
    }
    if (item.status === 'Baixado') {
        infoSpan.innerHTML = '<span style="color: var(--danger); font-weight: bold;">ITEM BAIXADO (DEVOLVIDO/DESCARTADO).</span>';
        document.getElementById('vendaPreco').value = '';
        return;
    }

    infoSpan.innerHTML = `
        <span style="font-weight: bold;">${item.descricao}</span><br>
        Consignatário: ${consignatario.nome}<br>
        Sugestão: ${formatarMoeda(item.precoSugerido)} | Comissão Padrão: ${config.comissaoPadrao}%
    `;

    infoSpan.dataset.itemId = item.id;
    document.getElementById('vendaPreco').value = item.precoSugerido; // Sugere o preço
}

/**
 * Registra uma nova venda.
 */
function registrarVenda() {
    const itemId = parseInt(document.getElementById('item-info').dataset.itemId);
    const compradorId = parseInt(document.getElementById('vendaComprador').value);
    const bazarId = parseInt(document.getElementById('vendaBazar').value);
    const valorVenda = parseFloat(document.getElementById('vendaPreco').value);
    const tipoPagamento = document.getElementById('vendaTipoPagamento').value;
    const dataVenda = document.getElementById('vendaData').value;
    
    // Configurações e Comissionamento
    const comissaoPadrao = dados.config.comissaoPadrao;
    const item = dados.itens.find(i => i.id === itemId);

    if (!itemId || !compradorId || !bazarId || isNaN(valorVenda) || valorVenda <= 0 || !dataVenda) {
        showToast('Preencha todos os campos da venda corretamente.', 'error');
        return;
    }
    
    if (!item || item.status !== 'Disponível') {
        showToast('Item indisponível para venda ou código inválido.', 'error');
        return;
    }
    
    // Verificação de Desconto Máximo
    const descontoMaximo = dados.config.descontoMaximo;
    const precoSugerido = item.precoSugerido;
    const descontoAplicado = precoSugerido - valorVenda;
    const percentualDesconto = (descontoAplicado / precoSugerido) * 100;

    if (percentualDesconto > descontoMaximo) {
        showToast(`Desconto de ${percentualDesconto.toFixed(2)}% excede o máximo permitido de ${descontoMaximo}%.`, 'error');
        return;
    }

    // Cálculo Repasse e Comissão
    const comissaoPercentual = comissaoPadrao; // Poderia ser ajustado por item/consignatário, mas usa o padrão
    const comissaoValor = valorVenda * (comissaoPercentual / 100);
    const repasseValor = valorVenda - comissaoValor;
    
    // 1. Atualizar o item para 'Vendido'
    item.status = 'Vendido';

    // 2. Criar o registro de Venda
    const novoId = dados.vendas.length > 0 ? Math.max(...dados.vendas.map(v => v.id)) + 1 : 1;
    const novaVenda = {
        id: novoId,
        itemId: itemId,
        compradorId: compradorId,
        bazarId: bazarId,
        valorVenda: valorVenda,
        tipoPagamento: tipoPagamento,
        comissaoPercentual: comissaoPercentual,
        data: dataVenda
    };
    dados.vendas.push(novaVenda);
    
    // 3. Atualizar o crédito do Consignatário
    const consignatario = dados.consignatarios.find(c => c.id === item.consignatarioId);
    if (consignatario) {
        consignatario.credito += repasseValor;
        consignatario.historicoCredito.push({
            data: dataVenda,
            tipo: "Crédito (Venda)",
            descricao: `Venda do item ${item.codigo} (R$ ${valorVenda.toFixed(2)}) - Repasse: R$ ${repasseValor.toFixed(2)}`,
            valor: repasseValor
        });
    }

    salvarDados();
    renderizarTabelaVendas();
    renderizarTabelaItens();
    renderizarTabelaConsignatarios();
    renderizarTabelaBazares();
    renderizarDashboard();
    limparFormVenda();
    showToast(`Venda do item ${item.codigo} registrada com sucesso! Repasse: ${formatarMoeda(repasseValor)}`);
}

/**
 * Limpa o formulário de Venda.
 */
function limparFormVenda() {
    document.getElementById('vendaItem').value = '';
    document.getElementById('item-info').innerHTML = '';
    document.getElementById('item-info').dataset.itemId = '';
    document.getElementById('vendaPreco').value = '';
    document.getElementById('vendaTipoPagamento').value = 'Dinheiro';
    document.getElementById('vendaData').value = new Date().toISOString().substring(0, 10);
}

/**
 * Reverte uma venda.
 */
function reverterVenda(vendaId) {
    if (!confirm('ATENÇÃO: Reverter esta venda? O crédito será subtraído do consignatário e o item voltará a ser "Disponível".')) {
        return;
    }

    const vendaIndex = dados.vendas.findIndex(v => v.id === vendaId);
    if (vendaIndex === -1) return;

    const venda = dados.vendas[vendaIndex];
    const item = dados.itens.find(i => i.id === venda.itemId);
    const consignatario = dados.consignatarios.find(c => c.id === (item ? item.consignatarioId : null));

    const comissaoValor = venda.valorVenda * (venda.comissaoPercentual / 100);
    const repasseValor = venda.valorVenda - comissaoValor;

    // 1. Reverter crédito do Consignatário
    if (consignatario) {
        consignatario.credito -= repasseValor;
        consignatario.historicoCredito.push({
            data: new Date().toISOString().substring(0, 10),
            tipo: "Débito (Reversão)",
            descricao: `REVERSÃO da venda ${venda.id} (Item ${item.codigo})`,
            valor: -repasseValor
        });
    }

    // 2. Atualizar o item para 'Disponível'
    if (item) {
        item.status = 'Disponível';
    }

    // 3. Remover a venda
    dados.vendas.splice(vendaIndex, 1);

    salvarDados();
    renderizarTodasTabelas();
    renderizarDashboard();
    showToast(`Venda ${vendaId} revertida com sucesso!`, 'warning');
}


// =========================================
// FUNÇÕES DE RELATÓRIOS E CRÉDITO
// =========================================

/**
 * Gera e exibe o relatório de um consignatário.
 */
function gerarRelatorioConsignatario() {
    const consignatarioId = parseInt(document.getElementById('relatorioConsignatario').value);
    const bazarId = document.getElementById('relatorioBazar').value ? parseInt(document.getElementById('relatorioBazar').value) : null;
    const outputDiv = document.getElementById('relatorioOutput');
    const btnDownload = document.getElementById('downloadRelatorio');

    outputDiv.innerHTML = '';
    btnDownload.style.display = 'none';
    
    if (!consignatarioId) {
        outputDiv.innerHTML = '<p class="text-muted">Selecione um consignatário para gerar o relatório.</p>';
        return;
    }

    const consignatario = dados.consignatarios.find(c => c.id === consignatarioId);
    if (!consignatario) return;

    const itensConsignatario = dados.itens.filter(i => i.consignatarioId === consignatarioId);

    // Vendas Finais (para o relatório)
    let vendasConsignatario = dados.vendas.filter(v => {
        const item = dados.itens.find(i => i.id === v.itemId);
        return item && item.consignatarioId === consignatarioId && (!bazarId || v.bazarId === bazarId);
    });
    
    // Agrupamento de itens
    const itensDisponiveis = itensConsignatario.filter(i => i.status === 'Disponível' && (!bazarId || i.bazarEntradaId === bazarId));
    const itensVendidos = vendasConsignatario.map(v => {
        const item = dados.itens.find(i => i.id === v.itemId);
        return { 
            ...v, 
            codigo: item ? item.codigo : 'DELETADO', 
            descricao: item ? item.descricao : 'Item Removido', 
            precoSugerido: item ? item.precoSugerido : 0
        };
    });
    const itensBaixados = itensConsignatario.filter(i => i.status === 'Baixado' && (!bazarId || i.bazarEntradaId === bazarId));

    // Cálculos
    const totalVendido = vendasConsignatario.reduce((sum, v) => sum + v.valorVenda, 0);
    const totalComissao = vendasConsignatario.reduce((sum, v) => sum + (v.valorVenda * (v.comissaoPercentual / 100)), 0);
    const totalRepasse = totalVendido - totalComissao;

    const bazarNome = bazarId ? dados.bazares.find(b => b.id === bazarId)?.nome : 'TODOS';

    // RENDERIZAÇÃO
    let html = `
        <h3>Relatório de Consignatário: ${consignatario.nome}</h3>
        <p><strong>Filtro Bazar:</strong> ${bazarNome}</p>
        <p><strong>Crédito Atual:</strong> <span style="font-size: 1.2rem; font-weight: bold; color: ${consignatario.credito >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatarMoeda(consignatario.credito)}</span></p>
        
        <div class="stats-grid small-grid" style="margin-top: 20px; grid-template-columns: repeat(3, 1fr);">
            <div class="stat-card primary" style="background-color: var(--primary-dark);">
                <p>Total Vendido (Bruto)</p>
                <span id="relTotalVendido">${formatarMoeda(totalVendido)}</span>
            </div>
            <div class="stat-card success">
                <p>Total Repasse (Líquido)</p>
                <span id="relTotalRepasse">${formatarMoeda(totalRepasse)}</span>
            </div>
            <div class="stat-card danger">
                <p>Total Comissão</p>
                <span id="relTotalComissao">${formatarMoeda(totalComissao)}</span>
            </div>
        </div>

        <h4>Itens Vendidos (${itensVendidos.length})</h4>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Cód.</th>
                        <th>Descrição</th>
                        <th>Vlr Venda</th>
                        <th>Repasse</th>
                        <th>Data</th>
                        <th>Bazar</th>
                    </tr>
                </thead>
                <tbody>
                    ${itensVendidos.map(v => {
                        const repasse = v.valorVenda * (1 - v.comissaoPercentual / 100);
                        const bazar = dados.bazares.find(b => b.id === v.bazarId)?.nome || 'N/A';
                        return `
                            <tr>
                                <td>${v.codigo}</td>
                                <td>${v.descricao}</td>
                                <td>${formatarMoeda(v.valorVenda)}</td>
                                <td>${formatarMoeda(repasse)}</td>
                                <td>${v.data}</td>
                                <td>${bazar}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        <h4>Itens Disponíveis (${itensDisponiveis.length})</h4>
        <ul>
            ${itensDisponiveis.map(i => `<li>${i.codigo} - ${i.descricao} (${formatarMoeda(i.precoSugerido)}) - Bazar: ${dados.bazares.find(b => b.id === i.bazarEntradaId)?.nome || 'N/A'}</li>`).join('')}
        </ul>
        
        <h4>Itens Baixados (${itensBaixados.length})</h4>
        <ul>
            ${itensBaixados.map(i => `<li>${i.codigo} - ${i.descricao} (${formatarMoeda(i.precoSugerido)}) - Bazar: ${dados.bazares.find(b => b.id === i.bazarEntradaId)?.nome || 'N/A'}</li>`).join('')}
        </ul>
    `;
    
    outputDiv.innerHTML = html;
    btnDownload.style.display = 'inline-flex';
    
    // Histórico de Crédito
    renderizarTabelaHistoricoCredito(consignatario);
}

/**
 * Renderiza o histórico de crédito/pagamento do consignatário.
 */
function renderizarTabelaHistoricoCredito(consignatario) {
    const tbody = document.getElementById('creditoHistoricoTable').querySelector('tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const historicoOrdenado = [...consignatario.historicoCredito].sort((a, b) => new Date(b.data) - new Date(a.data));

    historicoOrdenado.forEach(hist => {
        const tr = tbody.insertRow();
        const color = hist.valor >= 0 ? 'var(--success)' : 'var(--danger)';
        tr.innerHTML = `
            <td>${hist.data}</td>
            <td>${hist.tipo}</td>
            <td>${hist.descricao}</td>
            <td><span style="font-weight: 600; color: ${color};">${formatarMoeda(hist.valor)}</span></td>
        `;
    });
}

/**
 * Realiza um ajuste manual no crédito de um consignatário.
 */
function ajustarCredito() {
    const consignatarioId = parseInt(document.getElementById('relatorioConsignatario').value);
    const ajusteTipo = document.getElementById('ajusteTipo').value;
    const ajusteValor = parseFloat(document.getElementById('ajusteValor').value);
    const ajusteDescricao = document.getElementById('ajusteDescricao').value;

    if (!consignatarioId || isNaN(ajusteValor) || ajusteValor <= 0 || !ajusteDescricao) {
        showToast('Selecione o consignatário e preencha o valor e a descrição do ajuste.', 'error');
        return;
    }
    
    const consignatario = dados.consignatarios.find(c => c.id === consignatarioId);
    if (!consignatario) return;
    
    const valorAjustado = ajusteTipo === 'Adicionar' ? ajusteValor : -ajusteValor;

    consignatario.credito += valorAjustado;
    consignatario.historicoCredito.push({
        data: new Date().toISOString().substring(0, 10),
        tipo: `Ajuste (${ajusteTipo})`,
        descricao: ajusteDescricao,
        valor: valorAjustado
    });

    salvarDados();
    renderizarTabelaConsignatarios();
    gerarRelatorioConsignatario();
    
    document.getElementById('ajusteValor').value = '';
    document.getElementById('ajusteDescricao').value = '';
    showToast(`Crédito de ${consignatario.nome} ajustado em ${formatarMoeda(valorAjustado)}.`);
}

/**
 * Exporta o relatório do consignatário ativo em PDF.
 */
function exportarRelatorioPDF() {
    const consignatarioId = parseInt(document.getElementById('relatorioConsignatario').value);
    const consignatario = dados.consignatarios.find(c => c.id === consignatarioId);
    
    if (!consignatario) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const fileName = `Relatorio_${consignatario.nome.replace(/\s/g, '_')}_${new Date().toISOString().substring(0, 10)}.pdf`;
    let y = 10;
    
    doc.setFontSize(18);
    doc.text(`Relatório de Consignatário: ${consignatario.nome}`, 10, y);
    y += 7;
    
    doc.setFontSize(12);
    doc.text(`Crédito Atual: ${formatarMoeda(consignatario.credito)}`, 10, y);
    y += 10;

    // Função para pegar dados da tabela
    const getTableData = (selector, headers) => {
        const table = document.querySelector(selector);
        if (!table) return { head: [headers], body: [] };
        
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const body = rows.map(row => Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim()));
        return { head: [headers], body: body };
    };

    // 1. Histórico de Crédito
    doc.setFontSize(14);
    doc.text("Histórico de Créditos/Pagamentos", 10, y);
    y += 5;
    
    const creditoData = getTableData(
        '#creditoHistoricoTable', 
        ['Data', 'Tipo', 'Descrição', 'Valor']
    );
    
    doc.autoTable({
        startY: y,
        head: creditoData.head,
        body: creditoData.body,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [139, 92, 246] },
        didDrawPage: function(data) { y = data.cursor.y + 5; }
    });

    // 2. Itens Vendidos (Tabela no output)
    doc.setFontSize(14);
    doc.text("Itens Vendidos", 10, y);
    y += 5;

    const vendasData = getTableData(
        '#relatorioOutput table', // Pega a tabela de vendas do output
        ['Cód.', 'Descrição', 'Vlr Venda', 'Repasse', 'Data', 'Bazar']
    );
    
    doc.autoTable({
        startY: y,
        head: vendasData.head,
        body: vendasData.body,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [16, 185, 129] },
        didDrawPage: function(data) { y = data.cursor.y + 5; }
    });
    
    // 3. Itens Disponíveis (Lista)
    const itensDisponiveis = document.querySelectorAll('#relatorioOutput h4:nth-of-type(3) + ul li');
    if (itensDisponiveis.length > 0) {
        doc.setFontSize(14);
        doc.text("Itens Disponíveis", 10, y);
        y += 5;
        
        itensDisponiveis.forEach(item => {
            if (y > doc.internal.pageSize.height - 20) {
                doc.addPage();
                y = 10;
            }
            doc.setFontSize(10);
            doc.text(`- ${item.textContent.trim()}`, 10, y);
            y += 5;
        });
    }

    doc.save(fileName);
}

// =========================================
// FUNÇÕES DE CONFIGURAÇÃO E DADOS
// =========================================

/**
 * Salva as configurações do sistema.
 */
function salvarConfiguracoes() {
    const comissaoPadrao = parseFloat(document.getElementById('comissaoPadrao').value);
    const descontoMaximo = parseFloat(document.getElementById('descontoMaximo').value);

    if (isNaN(comissaoPadrao) || isNaN(descontoMaximo) || comissaoPadrao < 0 || comissaoPadrao > 100 || descontoMaximo < 0 || descontoMaximo > 100) {
        showToast('Valores de configuração inválidos.', 'error');
        return;
    }

    dados.config.comissaoPadrao = comissaoPadrao;
    dados.config.descontoMaximo = descontoMaximo;
    salvarDados();
    showToast('Configurações salvas com sucesso!');
}

/**
 * Exporta todos os dados do sistema para um arquivo JSON.
 */
function exportarDados() {
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bazarplus_backup_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Dados exportados com sucesso!');
}

/**
 * Importa dados de um arquivo JSON.
 */
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.itens && importedData.consignatarios && importedData.vendas) {
                dados = { ...dados, ...importedData }; // Mescla ou substitui
                salvarDados();
                carregarDados();
                showToast('Dados importados com sucesso!');
            } else {
                showToast('Arquivo JSON inválido. Verifique a estrutura.', 'error');
            }
        } catch (error) {
            showToast('Erro ao ler o arquivo JSON.', 'error');
            console.error(error);
        }
    };
    reader.readAsText(file);
}

/**
 * Limpa todos os dados do LocalStorage.
 */
function limparTodosDados() {
    if (confirm('ATENÇÃO: Você tem certeza que deseja APAGAR TODOS os dados? Esta ação é IRREVERSÍVEL! Faça um backup antes.')) {
        localStorage.removeItem(STORAGE_KEY);
        // Reinicializa a estrutura de dados
        dados = {
            itens: [],
            consignatarios: [],
            compradores: [],
            vendas: [],
            bazares: [],
            config: { comissaoPadrao: 30, descontoMaximo: 10 }
        };
        carregarDados();
        showToast('Todos os dados foram removidos. O sistema foi reinicializado.', 'danger');
    }
}

// =========================================
// INICIALIZAÇÃO E EVENT LISTENERS
// =========================================

/**
 * Verifica se o script está sendo carregado corretamente e faz ajustes iniciais.
 */
function checkInitializers() {
    // 1. Define a data atual no campo de venda
    document.getElementById('vendaData').value = new Date().toISOString().substring(0, 10);
    
    // 2. Carrega configurações e aplica ao formulário
    document.getElementById('comissaoPadrao').value = dados.config.comissaoPadrao;
    document.getElementById('descontoMaximo').value = dados.config.descontoMaximo;
    
    // 3. Verifica e aplica Dark Mode
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('dark-mode-toggle').checked = true;
    }
    document.getElementById('dark-mode-toggle').addEventListener('change', toggleDarkMode);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    checkInitializers();

    // Abre a aba do dashboard ao carregar
    document.getElementById('dashboard').classList.add('active');

    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+S para salvar (Cadastrar Item/Cliente/Bazar)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const tabAtiva = document.querySelector('.tab-content.active').id;
            if (tabAtiva === 'itens') {
                adicionarItem();
            } else if (tabAtiva === 'consignatarios') {
                adicionarConsignatario();
            } else if (tabAtiva === 'compradores') {
                adicionarComprador();
            } else if (tabAtiva === 'bazares') {
                criarBazar();
            }
        }
        // Ctrl+E para exportar
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportarDados();
        }
    });
});