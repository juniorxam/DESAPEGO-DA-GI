// =========================================
// VARIÁVEIS GLOBAIS (Simulação de Banco de Dados)
// =========================================
let bazares = [];
let itens = [];
let clientes = []; // ARRAY DE CONSIGNATÁRIOS (DONOS DOS ITENS)
let compradores = []; // NOVO: ARRAY DE CLIENTES COMPRADORES
let vendas = [];
let consumos = [];
let configuracoes = {
    percentualConsignatario: 80,
    percentualLoja: 20,
    validadeCredito: 6,
    alertaEstoque: 5,
    tema: 'light'
};
let currentDashboardFilter = { mes: '', bazarId: '', consignatarioId: '' }; 

// VARIÁVEIS DE GRÁFICO REMOVIDAS PARA MELHORIA DE PERFORMANCE

// =========================================
// FUNÇÕES DE UTILIDADE
// =========================================
function gerarId(array) {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function obterDataHojeISO() {
    return new Date().toISOString().split('T')[0];
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const area = document.getElementById('notification-area');
    const notif = document.createElement('div');
    notif.className = `notification ${tipo}`;
    notif.innerHTML = mensagem;
    area.appendChild(notif);

    // Força o reflow para aplicar a transição
    void notif.offsetWidth; 
    notif.classList.add('show');

    setTimeout(() => {
        notif.classList.remove('show');
        notif.addEventListener('transitionend', () => {
            if (notif.parentNode) {
                notif.parentNode.removeChild(notif);
            }
        });
    }, 4000);
}

function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    configuracoes.tema = newTheme;
    salvarDados();
    
    // Atualiza o ícone
    const icon = document.querySelector('.theme-toggle i');
    icon.className = `fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}`;

    // Não há gráficos para redesenhar, então esta parte é ignorada
}


// =========================================
// GESTÃO DE DADOS (LOCAL STORAGE)
// =========================================
function salvarDados() {
    localStorage.setItem('bazares', JSON.stringify(bazares));
    localStorage.setItem('itens', JSON.stringify(itens));
    localStorage.setItem('clientes', JSON.stringify(clientes));
    localStorage.setItem('compradores', JSON.stringify(compradores));
    localStorage.setItem('vendas', JSON.stringify(vendas));
    localStorage.setItem('consumos', JSON.stringify(consumos));
    localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
}

function carregarDados() {
    bazares = JSON.parse(localStorage.getItem('bazares')) || [];
    itens = JSON.parse(localStorage.getItem('itens')) || [];
    clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    compradores = JSON.parse(localStorage.getItem('compradores')) || [];
    vendas = JSON.parse(localStorage.getItem('vendas')) || [];
    consumos = JSON.parse(localStorage.getItem('consumos')) || [];
    const configSalva = JSON.parse(localStorage.getItem('configuracoes'));
    if (configSalva) {
        configuracoes = { ...configuracoes, ...configSalva };
    }

    // Aplica o tema
    document.body.setAttribute('data-theme', configuracoes.tema);
    const icon = document.querySelector('.theme-toggle i');
    icon.className = `fas fa-${configuracoes.tema === 'dark' ? 'sun' : 'moon'}`;

    // Renderiza todas as tabelas e o dashboard inicial
    renderizarTodasTabelas();
    carregarFiltrosDashboard();
    renderizarDashboard();
    carregarSelectsRelatorios();
    renderizarConfiguracoes();
}

function renderizarTodasTabelas() {
    renderizarItens();
    renderizarConsignatarios();
    renderizarCompradores();
    renderizarBazares();
    renderizarVendas();
    renderizarConsumos();
}

// =========================================
// GESTÃO DE ITENS
// =========================================

function adicionarItem() {
    const descricao = document.getElementById('descricaoItem').value.trim();
    const valor = parseFloat(document.getElementById('valorItem').value);
    const consignatarioId = parseInt(document.getElementById('consignatarioIdItem').value);
    const bazarId = parseInt(document.getElementById('bazarIdItem').value);
    const categoria = document.getElementById('categoriaItem').value.trim();

    if (!descricao || isNaN(valor) || valor <= 0 || !consignatarioId || !bazarId) {
        mostrarNotificacao('Preencha todos os campos obrigatórios com valores válidos.', 'erro');
        return;
    }
    
    const novoItem = {
        id: gerarId(itens),
        descricao,
        valor,
        consignatarioId,
        bazarId,
        categoria,
        status: 'Disponível' // Novo: Status do item
    };

    itens.push(novoItem);
    salvarDados();
    renderizarItens();
    
    // Limpar campos
    document.getElementById('descricaoItem').value = '';
    document.getElementById('valorItem').value = '';
    document.getElementById('consignatarioIdItem').value = '';
    document.getElementById('bazarIdItem').value = '';
    document.getElementById('categoriaItem').value = '';

    mostrarNotificacao(`Item #${novoItem.id} "${descricao}" cadastrado com sucesso!`, 'sucesso');
    renderizarDashboard(); // Atualiza contagem de estoque
}

function renderizarItens() {
    const tabela = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    // Atualiza os selects de Consignatários e Bazares para a aba Itens
    popularSelect('consignatarioIdItem', clientes, 'nome', 'id', 'Selecione...');
    popularSelect('bazarIdItem', bazares, 'nome', 'id', 'Selecione...');
    
    itens.forEach(item => {
        if (item.status !== 'Vendido' && item.status !== 'Excluído') { // Filtra itens vendidos/excluídos
            const row = tabela.insertRow();
            const consignatario = clientes.find(c => c.id === item.consignatarioId);
            const bazar = bazares.find(b => b.id === item.bazarId);
            
            // Verifica o status do consignatário para cor de destaque
            const consigTemCredito = consignatario && consignatario.creditos > 0;
            const estoqueBaixo = itens.filter(i => i.consignatarioId === item.consignatarioId && i.status === 'Disponível').length <= configuracoes.alertaEstoque;
            
            let statusBadge = item.status;
            let statusClass = 'status-success';
            if (estoqueBaixo) {
                statusBadge = 'Estoque Baixo';
                statusClass = 'status-warning';
            }
            if (consigTemCredito) {
                 statusBadge += ' (Crédito)';
                 statusClass = 'status-info';
            }

            row.insertCell().textContent = item.id;
            row.insertCell().textContent = item.descricao;
            row.insertCell().textContent = formatarMoeda(item.valor);
            row.insertCell().textContent = consignatario ? consignatario.nome : 'N/A';
            row.insertCell().textContent = bazar ? bazar.nome : 'N/A';
            row.insertCell().textContent = item.categoria || '-';
            row.insertCell().innerHTML = `<span class="${statusClass}">${statusBadge}</span>`;
            
            const acoesCell = row.insertCell();
            acoesCell.innerHTML = `
                <button onclick="editarItem(${item.id})" class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
                <button onclick="confirmarExclusaoItem(${item.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
            `;
        }
    });
}

function filtrarItens() {
    const filtro = document.getElementById('filtroItens').value.toLowerCase();
    const linhas = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    for (let i = 0; i < linhas.length; i++) {
        const celulas = linhas[i].getElementsByTagName('td');
        let encontrado = false;
        
        // Verifica as colunas ID, Descrição e Consignatário
        if (celulas.length > 0) {
            const id = celulas[0].textContent.toLowerCase();
            const descricao = celulas[1].textContent.toLowerCase();
            const consignatario = celulas[3].textContent.toLowerCase();
            
            if (id.includes(filtro) || descricao.includes(filtro) || consignatario.includes(filtro)) {
                encontrado = true;
            }
        }
        
        linhas[i].style.display = encontrado ? '' : 'none';
    }
}

function confirmarExclusaoItem(itemId) {
    if (confirm(`Tem certeza que deseja EXCLUIR o item #${itemId}? Esta ação não pode ser desfeita.`)) {
        // Encontra o índice
        const index = itens.findIndex(item => item.id === itemId);

        if (index > -1) {
            // Verifica se o item foi vendido
            const foiVendido = vendas.some(v => v.itemId === itemId);
            
            if (foiVendido) {
                 mostrarNotificacao('Este item não pode ser excluído, pois já foi registrado em uma venda.', 'erro');
                 return;
            }
            
            itens.splice(index, 1);
            salvarDados();
            renderizarItens();
            mostrarNotificacao(`Item #${itemId} excluído com sucesso.`, 'danger');
            renderizarDashboard();
        }
    }
}


// =========================================
// GESTÃO DE CONSIGNATÁRIOS
// =========================================
function adicionarConsignatario() {
    const nome = document.getElementById('nomeConsignatario').value.trim();
    const contato = document.getElementById('contatoConsignatario').value.trim();
    const banco = document.getElementById('bancoConsignatario').value.trim();

    if (!nome || !contato) {
        mostrarNotificacao('Nome e Contato são obrigatórios.', 'erro');
        return;
    }
    
    const novoConsignatario = {
        id: gerarId(clientes),
        nome,
        contato,
        banco,
        creditos: 0 // Saldo inicial de créditos
    };

    clientes.push(novoConsignatario);
    salvarDados();
    renderizarConsignatarios();
    
    // Limpar campos
    document.getElementById('nomeConsignatario').value = '';
    document.getElementById('contatoConsignatario').value = '';
    document.getElementById('bancoConsignatario').value = '';

    mostrarNotificacao(`Consignatário "${nome}" cadastrado com sucesso!`, 'sucesso');
    carregarSelectsRelatorios();
    renderizarItens(); // Atualiza a lista de itens
    renderizarDashboard();
}

function renderizarConsignatarios() {
    const tabela = document.getElementById('tabelaConsignatarios').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    clientes.forEach(c => {
        const row = tabela.insertRow();
        row.insertCell().textContent = c.id;
        row.insertCell().textContent = c.nome;
        row.insertCell().textContent = c.contato;
        
        // Destaque para o crédito
        const creditosCell = row.insertCell();
        creditosCell.textContent = formatarMoeda(c.creditos);
        if (c.creditos > 0) {
            creditosCell.style.fontWeight = 'bold';
            creditosCell.style.color = 'var(--success)';
        }

        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="editarConsignatario(${c.id})" class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
            <button onclick="confirmarExclusaoConsignatario(${c.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
        `;
    });
}

function confirmarExclusaoConsignatario(consigId) {
    if (confirm(`Tem certeza que deseja EXCLUIR o Consignatário #${consigId}? TODOS os itens e vendas relacionados a ele serão afetados ou excluídos.`)) {
        const index = clientes.findIndex(c => c.id === consigId);

        if (index > -1) {
            // Regra 1: Não pode ter saldo devedor
            if (clientes[index].creditos > 0) {
                mostrarNotificacao('Não é possível excluir: o consignatário ainda possui créditos pendentes.', 'erro');
                return;
            }
            
            // Regra 2: Não pode ter itens disponíveis em estoque
            const itensDisponiveis = itens.some(i => i.consignatarioId === consigId && i.status === 'Disponível');
            if (itensDisponiveis) {
                 mostrarNotificacao('Não é possível excluir: o consignatário ainda possui itens disponíveis em estoque.', 'erro');
                 return;
            }

            clientes.splice(index, 1);
            
            // Limpa/ajusta dados relacionados (melhoria de integridade)
            itens = itens.filter(i => i.consignatarioId !== consigId); // Remove itens (se estivessem em estoque)
            vendas = vendas.filter(v => itens.some(i => i.id === v.itemId)); // Remove vendas de itens excluídos
            consumos = consumos.filter(x => x.consignatarioId !== consigId);
            
            salvarDados();
            renderizarConsignatarios();
            renderizarItens();
            renderizarVendas();
            renderizarConsumos();
            mostrarNotificacao(`Consignatário #${consigId} excluído com sucesso.`, 'danger');
            renderizarDashboard();
        }
    }
}


// =========================================
// GESTÃO DE COMPRADORES
// =========================================
function adicionarComprador() {
    const nome = document.getElementById('nomeComprador').value.trim();
    const contato = document.getElementById('contatoComprador').value.trim();

    if (!nome) {
        mostrarNotificacao('Nome do Comprador é obrigatório.', 'erro');
        return;
    }
    
    const novoComprador = {
        id: gerarId(compradores),
        nome,
        contato,
        totalVendas: 0 // Novo: Total de vendas associadas
    };

    compradores.push(novoComprador);
    salvarDados();
    renderizarCompradores();
    
    // Limpar campos
    document.getElementById('nomeComprador').value = '';
    document.getElementById('contatoComprador').value = '';

    mostrarNotificacao(`Comprador "${nome}" cadastrado com sucesso!`, 'sucesso');
    popularSelect('compradorVendaId', compradores, 'nome', 'id', 'Comprador não identificado');
}

function renderizarCompradores() {
    const tabela = document.getElementById('tabelaCompradores').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    // Atualiza a contagem de vendas de cada comprador
    compradores.forEach(c => c.totalVendas = vendas.filter(v => v.compradorId === c.id).reduce((sum, v) => sum + v.valorVenda, 0));
    
    compradores.forEach(c => {
        const row = tabela.insertRow();
        row.insertCell().textContent = c.id;
        row.insertCell().textContent = c.nome;
        row.insertCell().textContent = c.contato || '-';
        row.insertCell().textContent = formatarMoeda(c.totalVendas);
        
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="editarComprador(${c.id})" class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
            <button onclick="confirmarExclusaoComprador(${c.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
        `;
    });

    popularSelect('compradorVendaId', compradores, 'nome', 'id', 'Comprador não identificado');
}

function confirmarExclusaoComprador(compradorId) {
    if (confirm(`Tem certeza que deseja EXCLUIR o Comprador #${compradorId}? As vendas registradas permanecerão, mas o comprador será desassociado.`)) {
        const index = compradores.findIndex(c => c.id === compradorId);

        if (index > -1) {
            compradores.splice(index, 1);
            
            // Desassocia o comprador das vendas, mantendo a integridade das vendas
            vendas.forEach(v => {
                if (v.compradorId === compradorId) {
                    v.compradorId = null; 
                }
            });
            
            salvarDados();
            renderizarCompradores();
            renderizarVendas();
            mostrarNotificacao(`Comprador #${compradorId} excluído com sucesso.`, 'danger');
        }
    }
}


// =========================================
// GESTÃO DE BAZARES
// =========================================
function criarBazar() {
    const nome = document.getElementById('nomeBazar').value.trim();
    const endereco = document.getElementById('enderecoBazar').value.trim();

    if (!nome) {
        mostrarNotificacao('Nome do Bazar é obrigatório.', 'erro');
        return;
    }
    
    const novoBazar = {
        id: gerarId(bazares),
        nome,
        endereco
    };

    bazares.push(novoBazar);
    salvarDados();
    renderizarBazares();
    
    // Limpar campos
    document.getElementById('nomeBazar').value = '';
    document.getElementById('enderecoBazar').value = '';

    mostrarNotificacao(`Bazar "${nome}" cadastrado com sucesso!`, 'sucesso');
    renderizarItens(); // Atualiza a lista de itens
}

function renderizarBazares() {
    const tabela = document.getElementById('tabelaBazares').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    bazares.forEach(b => {
        const row = tabela.insertRow();
        row.insertCell().textContent = b.id;
        row.insertCell().textContent = b.nome;
        row.insertCell().textContent = b.endereco || '-';
        
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="editarBazar(${b.id})" class="btn btn-info btn-sm"><i class="fas fa-edit"></i></button>
            <button onclick="confirmarExclusaoBazar(${b.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
        `;
    });
    
    popularSelect('bazarIdItem', bazares, 'nome', 'id', 'Selecione...');
    carregarFiltrosDashboard();
}

function confirmarExclusaoBazar(bazarId) {
    if (confirm(`Tem certeza que deseja EXCLUIR o Bazar #${bazarId}? Todos os itens e vendas associadas a ele serão afetados.`)) {
        const index = bazares.findIndex(b => b.id === bazarId);

        if (index > -1) {
             // Regra: Não pode ter itens disponíveis em estoque
            const itensDisponiveis = itens.some(i => i.bazarId === bazarId && i.status === 'Disponível');
            if (itensDisponiveis) {
                 mostrarNotificacao('Não é possível excluir: o bazar ainda possui itens disponíveis em estoque.', 'erro');
                 return;
            }

            bazares.splice(index, 1);
            
            // Limpa/ajusta dados relacionados (melhoria de integridade)
            itens = itens.filter(i => i.bazarId !== bazarId); // Remove itens (se estivessem em estoque)
            vendas = vendas.filter(v => itens.some(i => i.id === v.itemId)); // Remove vendas de itens excluídos
            
            salvarDados();
            renderizarBazares();
            renderizarItens();
            renderizarVendas();
            mostrarNotificacao(`Bazar #${bazarId} excluído com sucesso.`, 'danger');
            renderizarDashboard();
        }
    }
}


// =========================================
// GESTÃO DE VENDAS
// =========================================
function buscarItemParaVenda() {
    const itemId = parseInt(document.getElementById('itemIdVenda').value);
    const descricaoCampo = document.getElementById('descricaoItemVenda');
    const valorCampo = document.getElementById('valorItemVenda');
    
    if (isNaN(itemId)) {
        descricaoCampo.value = '';
        valorCampo.value = '';
        return;
    }

    const item = itens.find(i => i.id === itemId);
    
    if (item && item.status === 'Disponível') {
        descricaoCampo.value = item.descricao;
        valorCampo.value = item.valor;
    } else if (item && item.status === 'Vendido') {
        descricaoCampo.value = `Item já vendido em ${vendas.find(v => v.itemId === itemId).dataVenda}`;
        valorCampo.value = item.valor;
        mostrarNotificacao('Atenção: Este item já foi vendido!', 'aviso');
    } else {
        descricaoCampo.value = 'Item não encontrado ou indisponível.';
        valorCampo.value = '';
        mostrarNotificacao('Item não encontrado ou indisponível.', 'erro');
    }
}

function registrarVenda() {
    const itemId = parseInt(document.getElementById('itemIdVenda').value);
    const valorVenda = parseFloat(document.getElementById('valorItemVenda').value);
    const dataVenda = document.getElementById('dataVenda').value;
    const formaPagamento = document.getElementById('formaPagamentoVenda').value;
    const compradorId = document.getElementById('compradorVendaId').value ? parseInt(document.getElementById('compradorVendaId').value) : null;

    const item = itens.find(i => i.id === itemId);

    if (!item || item.status !== 'Disponível') {
        mostrarNotificacao('Item inválido ou já vendido.', 'erro');
        return;
    }
    if (isNaN(valorVenda) || valorVenda <= 0 || !dataVenda) {
        mostrarNotificacao('Preencha todos os campos da venda corretamente.', 'erro');
        return;
    }

    const consignatario = clientes.find(c => c.id === item.consignatarioId);
    
    // Cálculo dos valores (garantindo que os percentuais são usados como floats)
    const percConsignatario = configuracoes.percentualConsignatario / 100;
    const percLoja = configuracoes.percentualLoja / 100;
    
    const creditoGerado = valorVenda * percConsignatario;
    const comissaoLoja = valorVenda * percLoja;

    // 1. Atualiza o status do item
    item.status = 'Vendido';

    // 2. Atualiza o crédito do consignatário
    if (consignatario) {
        consignatario.creditos += creditoGerado;
    } else {
        mostrarNotificacao(`Aviso: Consignatário #${item.consignatarioId} não encontrado. Crédito não foi gerado.`, 'aviso');
    }

    // 3. Registra a venda
    const novaVenda = {
        id: gerarId(vendas),
        itemId,
        bazarVendaId: item.bazarId,
        valorVenda,
        comissaoLoja: comissaoLoja,
        creditoGerado: creditoGerado,
        dataVenda,
        formaPagamento,
        compradorId
    };

    vendas.push(novaVenda);
    salvarDados();
    renderizarVendas();
    renderizarItens();
    renderizarConsignatarios();
    renderizarCompradores();
    renderizarDashboard();
    
    // Limpar campos
    document.getElementById('itemIdVenda').value = '';
    document.getElementById('descricaoItemVenda').value = '';
    document.getElementById('valorItemVenda').value = '';
    document.getElementById('dataVenda').value = obterDataHojeISO(); // Volta para data de hoje
    // O select de comprador e pagamento pode permanecer no último selecionado
    
    mostrarNotificacao(`Venda #${novaVenda.id} registrada. Crédito de ${formatarMoeda(creditoGerado)} gerado para ${consignatario.nome}.`, 'sucesso');
}

function renderizarVendas() {
    const tabela = document.getElementById('tabelaVendas').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';

    vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda)); // Mais recente primeiro
    
    vendas.forEach(v => {
        const row = tabela.insertRow();
        const item = itens.find(i => i.id === v.itemId);
        const consig = item ? clientes.find(c => c.id === item.consignatarioId) : null;
        const bazar = bazares.find(b => b.id === v.bazarVendaId);
        
        row.insertCell().textContent = v.id;
        row.insertCell().textContent = new Date(v.dataVenda).toLocaleDateString('pt-BR');
        row.insertCell().textContent = item ? item.descricao : 'Item Removido';
        row.insertCell().textContent = consig ? consig.nome : 'N/A';
        row.insertCell().textContent = bazar ? bazar.nome : 'N/A';
        row.insertCell().textContent = formatarMoeda(v.valorVenda);
        row.insertCell().textContent = formatarMoeda(v.comissaoLoja);
        row.insertCell().textContent = formatarMoeda(v.creditoGerado);
        
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="confirmarExclusaoVenda(${v.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
        `;
    });
}

function confirmarExclusaoVenda(vendaId) {
    if (confirm(`Tem certeza que deseja EXCLUIR a Venda #${vendaId}? O crédito gerado será revertido e o item voltará ao estoque.`)) {
        const index = vendas.findIndex(v => v.id === vendaId);

        if (index > -1) {
            const venda = vendas[index];
            const item = itens.find(i => i.id === venda.itemId);
            const consignatario = item ? clientes.find(c => c.id === item.consignatarioId) : null;
            
            // 1. Reverte o crédito do consignatário
            if (consignatario) {
                if (consignatario.creditos < venda.creditoGerado) {
                    mostrarNotificacao('Erro: Não foi possível reverter a venda, pois o consignatário já consumiu parte ou todo este crédito.', 'erro');
                    return;
                }
                consignatario.creditos -= venda.creditoGerado;
            }
            
            // 2. Devolve o item ao estoque
            if (item) {
                item.status = 'Disponível';
            }
            
            // 3. Remove a venda
            vendas.splice(index, 1);
            
            salvarDados();
            renderizarVendas();
            renderizarItens();
            renderizarConsignatarios();
            renderizarDashboard();
            mostrarNotificacao(`Venda #${vendaId} excluída. Crédito revertido e item retornado ao estoque.`, 'danger');
        }
    }
}


// =========================================
// GESTÃO DE CONSUMO DE CRÉDITO / SAQUE
// =========================================

function atualizarSaldoConsumo() {
    const consigId = document.getElementById('consignatarioIdConsumo').value;
    const saldoCampo = document.getElementById('saldoAtualConsumo');
    
    if (consigId) {
        const consig = clientes.find(c => c.id === parseInt(consigId));
        saldoCampo.value = consig ? formatarMoeda(consig.creditos) : 'R$ 0,00';
    } else {
        saldoCampo.value = 'R$ 0,00';
    }
}

function registrarConsumo() {
    const consignatarioId = parseInt(document.getElementById('consignatarioIdConsumo').value);
    const valorConsumo = parseFloat(document.getElementById('valorConsumo').value);
    const dataConsumo = document.getElementById('dataConsumo').value;
    const tipoConsumo = document.getElementById('tipoConsumo').value;
    const observacao = document.getElementById('observacaoConsumo').value.trim();

    const consignatario = clientes.find(c => c.id === consignatarioId);

    if (!consignatario || isNaN(valorConsumo) || valorConsumo <= 0 || !dataConsumo) {
        mostrarNotificacao('Preencha todos os campos do consumo corretamente.', 'erro');
        return;
    }
    
    if (valorConsumo > consignatario.creditos) {
        mostrarNotificacao('O valor do saque/consumo é maior que o crédito disponível do consignatário.', 'erro');
        return;
    }
    
    // 1. Atualiza o crédito do consignatário
    consignatario.creditos -= valorConsumo;

    // 2. Registra o consumo
    const novoConsumo = {
        id: gerarId(consumos),
        consignatarioId,
        valor: valorConsumo,
        dataConsumo,
        tipo: tipoConsumo,
        observacao
    };

    consumos.push(novoConsumo);
    salvarDados();
    renderizarConsumos();
    renderizarConsignatarios();
    renderizarDashboard();
    atualizarSaldoConsumo(); // Atualiza o saldo do campo

    // Limpar campos
    document.getElementById('valorConsumo').value = '';
    document.getElementById('observacaoConsumo').value = '';
    document.getElementById('dataConsumo').value = obterDataHojeISO();
    
    mostrarNotificacao(`Consumo de ${formatarMoeda(valorConsumo)} registrado para ${consignatario.nome}.`, 'sucesso');
}

function renderizarConsumos() {
    const tabela = document.getElementById('tabelaConsumos').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';
    
    // Atualiza os selects de Consignatários para a aba Consumo
    popularSelect('consignatarioIdConsumo', clientes, 'nome', 'id', 'Selecione...');
    
    consumos.sort((a, b) => new Date(b.dataConsumo) - new Date(a.dataConsumo)); // Mais recente primeiro

    consumos.forEach(x => {
        const row = tabela.insertRow();
        const consig = clientes.find(c => c.id === x.consignatarioId);
        
        row.insertCell().textContent = x.id;
        row.insertCell().textContent = new Date(x.dataConsumo).toLocaleDateString('pt-BR');
        row.insertCell().textContent = consig ? consig.nome : 'N/A';
        row.insertCell().textContent = x.tipo;
        row.insertCell().textContent = formatarMoeda(x.valor);
        row.insertCell().textContent = x.observacao || '-';
        
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="confirmarExclusaoConsumo(${x.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
        `;
    });
}

function confirmarExclusaoConsumo(consumoId) {
    if (confirm(`Tem certeza que deseja EXCLUIR o registro de Consumo #${consumoId}? O valor será creditado novamente ao consignatário.`)) {
        const index = consumos.findIndex(x => x.id === consumoId);

        if (index > -1) {
            const consumo = consumos[index];
            const consignatario = clientes.find(c => c.id === consumo.consignatarioId);

            // 1. Estorna o crédito
            if (consignatario) {
                consignatario.creditos += consumo.valor;
            }
            
            // 2. Remove o consumo
            consumos.splice(index, 1);
            
            salvarDados();
            renderizarConsumos();
            renderizarConsignatarios();
            renderizarDashboard();
            atualizarSaldoConsumo();
            mostrarNotificacao(`Consumo #${consumoId} estornado. Crédito de ${formatarMoeda(consumo.valor)} devolvido.`, 'danger');
        }
    }
}


// =========================================
// DASHBOARD
// =========================================

function carregarFiltrosDashboard() {
    const filterMes = document.getElementById('filterMes');
    const filterBazar = document.getElementById('filterBazar');
    const filterConsignatario = document.getElementById('filterConsignatario');

    filterMes.innerHTML = '<option value="">Todo Período</option>';
    filterBazar.innerHTML = '<option value="">Todos os Bazares</option>';
    filterConsignatario.innerHTML = '<option value="">Todos os Consignatários</option>';

    // Filtros de Mês
    const mesesVendas = new Set(vendas.map(v => v.dataVenda.substring(0, 7)).sort().reverse());
    mesesVendas.forEach(mesAno => {
        const [ano, mes] = mesAno.split('-');
        const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const option = new Option(nomeMes, mesAno);
        filterMes.appendChild(option);
    });

    // Filtros de Bazar
    bazares.forEach(b => {
        const option = new Option(b.nome, b.id);
        filterBazar.appendChild(option);
    });
    
    // Filtros de Consignatário
    clientes.forEach(c => {
        const option = new Option(c.nome, c.id);
        filterConsignatario.appendChild(option);
    });

    // Restaura o filtro selecionado
    filterMes.value = currentDashboardFilter.mes;
    filterBazar.value = currentDashboardFilter.bazarId;
    filterConsignatario.value = currentDashboardFilter.consignatarioId;
}

function filtrarDashboard() {
    currentDashboardFilter.mes = document.getElementById('filterMes').value;
    currentDashboardFilter.bazarId = document.getElementById('filterBazar').value;
    currentDashboardFilter.consignatarioId = document.getElementById('filterConsignatario').value;
    renderizarDashboard();
}

function renderizarDashboard() {
    let vendasFiltradas = vendas;

    // Filtro por Mês
    if (currentDashboardFilter.mes) {
        vendasFiltradas = vendasFiltradas.filter(v => v.dataVenda.startsWith(currentDashboardFilter.mes));
    }
    // Filtro por Bazar
    if (currentDashboardFilter.bazarId) {
        const bazarId = parseInt(currentDashboardFilter.bazarId);
        vendasFiltradas = vendasFiltradas.filter(v => v.bazarVendaId === bazarId);
    }
    // Filtro por Consignatário
    if (currentDashboardFilter.consignatarioId) {
        const consignatarioId = parseInt(currentDashboardFilter.consignatarioId);
        vendasFiltradas = vendasFiltradas.filter(v => {
            const item = itens.find(i => i.id === v.itemId);
            return item && item.consignatarioId === consignatarioId;
        });
    }

    // CÁLCULOS DOS CARDS
    
    // Total de Vendas
    const totalVendas = vendasFiltradas.reduce((sum, v) => sum + v.valorVenda, 0);
    document.getElementById('cardTotalVendas').textContent = formatarMoeda(totalVendas);

    // Comissão da Loja
    const totalComissao = vendasFiltradas.reduce((sum, v) => sum + v.comissaoLoja, 0);
    document.getElementById('cardTotalComissao').textContent = formatarMoeda(totalComissao);

    // Crédito Pendente Total
    const totalCreditoPendente = clientes.reduce((sum, c) => sum + c.creditos, 0);
    document.getElementById('cardCreditoPendente').textContent = formatarMoeda(totalCreditoPendente);

    // Estoque Atual (Itens Disponíveis)
    const estoqueAtual = itens.filter(i => i.status === 'Disponível').length;
    document.getElementById('cardEstoqueAtual').textContent = estoqueAtual;

    // Itens Vendidos (pelo filtro)
    document.getElementById('cardItensVendidos').textContent = vendasFiltradas.length;

    // Consignatários com Crédito Pendente
    const consignatariosPendentes = clientes.filter(c => c.creditos > 0).length;
    document.getElementById('cardConsignatariosPendentes').textContent = consignatariosPendentes;

    // =========================================
    // GRÁFICOS (LÓGICA REMOVIDA PARA PERFORMANCE)
    // =========================================
    // A lógica de destroy e criação dos gráficos foi removida aqui.
}


// =========================================
// FUNÇÕES DE RELATÓRIOS (PDF)
// =========================================

function carregarSelectsRelatorios() {
     popularSelect('selectRelatorioConsignatario', clientes, 'nome', 'id', 'Selecione...');
}

function dispararRelatorioConsignatario() {
    const consignatarioId = parseInt(document.getElementById('selectRelatorioConsignatario').value);
    if (!consignatarioId) {
        mostrarNotificacao('Selecione um consignatário para gerar o relatório.', 'erro');
        return;
    }
    gerarRelatorioConsignatarioPDF(consignatarioId);
}

function gerarRelatorioConsignatarioPDF(consignatarioId) {
    const consig = clientes.find(c => c.id === consignatarioId);
    if (!consig) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor = [139, 92, 246];

    // Dados do Consignatário
    const vendasConsig = vendas.filter(v => 
        itens.some(i => i.id === v.itemId && i.consignatarioId === consig.id)
    );
    const consumosConsig = consumos.filter(x => x.consignatarioId === consig.id);
    const itensConsig = itens.filter(i => i.consignatarioId === consig.id);

    const totalVendas = vendasConsig.reduce((sum, v) => sum + v.valorVenda, 0);
    const totalCreditoGerado = vendasConsig.reduce((sum, v) => sum + v.creditoGerado, 0);
    const totalConsumido = consumosConsig.reduce((sum, x) => sum + x.valor, 0);

    // Título e Detalhes
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Relatório de Consignatário: ${consig.nome}`, 10, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`ID: ${consig.id} | Contato: ${consig.contato}`, 10, 20);
    doc.text(`Crédito Pendente Atual: ${formatarMoeda(consig.creditos)}`, 10, 25);
    doc.text(`Total Gerado: ${formatarMoeda(totalCreditoGerado)} | Total Consumido: ${formatarMoeda(totalConsumido)}`, 10, 30);
    
    let finalY = 35;

    // --- Tabela de Vendas ---
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Histórico de Vendas', 10, finalY + 10);
    finalY += 15;

    const vendasBody = vendasConsig.map(v => {
        const item = itens.find(i => i.id === v.itemId);
        return [
            v.dataVenda,
            item ? item.descricao : 'N/A',
            formatarMoeda(v.valorVenda),
            formatarMoeda(v.creditoGerado),
            v.formaPagamento
        ];
    });

    if (vendasBody.length > 0) {
        doc.autoTable({
            startY: finalY,
            head: [['Data', 'Item Vendido', 'Valor Venda', 'Crédito Gerado', 'Pagamento']],
            body: vendasBody,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 1, textColor: 30 },
            columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
            didDrawPage: (data) => { finalY = data.cursor.y; }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Nenhuma venda registrada.', 10, finalY);
        finalY += 10;
    }

    // --- Tabela de Consumos ---
    finalY += 10;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Histórico de Consumo/Saque de Crédito', 10, finalY);
    finalY += 5;

    const consumoBody = consumosConsig.map(x => [
        x.dataConsumo,
        x.tipo,
        formatarMoeda(x.valor),
        x.observacao
    ]);

    if (consumoBody.length > 0) {
        doc.autoTable({
            startY: finalY + 5,
            head: [['Data', 'Tipo', 'Valor Consumido', 'Observação']],
            body: consumoBody,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 1, textColor: 30 },
            columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
            didDrawPage: (data) => { finalY = data.cursor.y; }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Nenhum consumo/saque de crédito registrado.', 10, finalY + 5);
        finalY += 15;
    }
    
    // --- Tabela de Estoque Atual ---
    finalY += 10;
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('Itens Atualmente em Estoque', 10, finalY);
    finalY += 5;

    const estoqueBody = itensConsig.filter(i => i.status === 'Disponível').map(i => {
        const bazar = bazares.find(b => b.id === i.bazarId);
        return [
            i.id,
            i.descricao,
            formatarMoeda(i.valor),
            bazar ? bazar.nome : 'N/A',
            i.categoria
        ];
    });

    if (estoqueBody.length > 0) {
         doc.autoTable({
            startY: finalY + 5,
            head: [['ID', 'Descrição', 'Valor Venda', 'Bazar', 'Categoria']],
            body: estoqueBody,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 1, textColor: 30 },
            columnStyles: { 2: { halign: 'right' } },
            didDrawPage: (data) => { finalY = data.cursor.y; }
        });
    } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('Nenhum item atualmente em estoque.', 10, finalY + 5);
        finalY += 15;
    }

    doc.save(`Relatorio_Consignatario_${consig.nome.replace(/\s/g, '_')}.pdf`);
    mostrarNotificacao(`Relatório de ${consig.nome} gerado!`, 'sucesso');
}


// =========================================
// NOVAS FUNÇÕES DE RELATÓRIOS GERAIS (PDF)
// =========================================

function gerarRelatorioVendasPorBazarPDF() {
    const { jsPDF } = window.jspdf;
    // Orientação paisagem para caber mais colunas
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const primaryColor = [139, 92, 246];

    const anoAtual = new Date().getFullYear();
    const vendasAno = vendas.filter(v => new Date(v.dataVenda).getFullYear() === anoAtual);
    
    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Relatório de Vendas por Bazar (Detalhado - Ano ${anoAtual})`, 10, 15);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 20);

    let finalY = 25;

    // Agrupamento por Bazar
    const vendasAgrupadas = bazares.map(bazar => {
        const vendasBazar = vendasAno.filter(v => v.bazarVendaId === bazar.id);
        
        return {
            nome: bazar.nome,
            totalVendas: vendasBazar.reduce((sum, v) => sum + v.valorVenda, 0),
            totalComissao: vendasBazar.reduce((sum, v) => sum + v.comissaoLoja, 0),
            totalCredito: vendasBazar.reduce((sum, v) => sum + v.creditoGerado, 0),
            detalhes: vendasBazar.map(v => {
                const item = itens.find(i => i.id === v.itemId);
                const consig = clientes.find(c => c.id === (item ? item.consignatarioId : null));
                return [
                    v.dataVenda,
                    item ? item.descricao : 'N/A',
                    consig ? consig.nome : 'N/A',
                    formatarMoeda(v.valorVenda),
                    formatarMoeda(v.creditoGerado),
                    v.formaPagamento
                ];
            })
        };
    }).filter(g => g.detalhes.length > 0);


    vendasAgrupadas.forEach(grupo => {
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`Bazar: ${grupo.nome}`, 10, finalY + 5);
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(`Total Vendas: ${formatarMoeda(grupo.totalVendas)} | Comissão Loja: ${formatarMoeda(grupo.totalComissao)} | Crédito Gerado: ${formatarMoeda(grupo.totalCredito)}`, 10, finalY + 10);
        finalY += 15;

        const head = [['Data', 'Item', 'Consignatário', 'Valor Venda', 'Crédito Gerado', 'Pagamento']];
        
        doc.autoTable({
            startY: finalY,
            head: head,
            body: grupo.detalhes,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak', textColor: 30 },
            columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => {
                finalY = data.cursor.y;
            }
        });
        finalY = doc.autoTable.previous.finalY + 5; // Atualiza finalY para depois da tabela
    });

    if (vendasAgrupadas.length === 0) {
         doc.text('Nenhuma venda registrada neste ano.', 10, finalY + 5);
    }
    
    doc.save(`Relatorio_Vendas_Bazar_${anoAtual}.pdf`);
    mostrarNotificacao('Relatório de Vendas por Bazar gerado!', 'sucesso');
}

function gerarRelatorioVendasPorConsignatarioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const primaryColor = [139, 92, 246];
    
    const anoAtual = new Date().getFullYear();
    const vendasAno = vendas.filter(v => new Date(v.dataVenda).getFullYear() === anoAtual);

    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Relatório de Vendas por Consignatário (Ano ${anoAtual})`, 10, 15);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 20);

    let finalY = 25;
    
    const head = [['Consignatário', 'Total Vendas', 'Itens Vendidos', 'Comissão Loja', 'Crédito Gerado']];
    const body = clientes.map(c => {
        // Encontra as vendas dos itens deste consignatário no ano
        const vendasConsig = vendasAno.filter(v => 
            itens.some(i => i.id === v.itemId && i.consignatarioId === c.id)
        );
        const totalVendas = vendasConsig.reduce((sum, v) => sum + v.valorVenda, 0);
        const itensVendidos = vendasConsig.length;
        const totalComissao = vendasConsig.reduce((sum, v) => sum + v.comissaoLoja, 0);
        const totalCredito = vendasConsig.reduce((sum, v) => sum + v.creditoGerado, 0);

        if (totalVendas === 0) return null; // Ignora consignatários sem vendas no ano

        return [
            c.nome,
            formatarMoeda(totalVendas),
            itensVendidos,
            formatarMoeda(totalComissao),
            formatarMoeda(totalCredito)
        ];
    }).filter(row => row !== null);
    
    if (body.length === 0) {
        doc.text('Nenhuma venda registrada neste ano.', 10, finalY);
        doc.save(`Relatorio_Vendas_Consignatario_${anoAtual}.pdf`);
        mostrarNotificacao('Nenhuma venda encontrada para gerar o relatório.', 'aviso');
        return;
    }

    doc.autoTable({
        startY: finalY,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 2, textColor: 30 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        margin: { left: 10, right: 10 }
    });

    doc.save(`Relatorio_Vendas_Consignatario_${anoAtual}.pdf`);
    mostrarNotificacao('Relatório de Vendas por Consignatário gerado!', 'sucesso');
}

function gerarRelatorioVendasPorMesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor = [139, 92, 246];
    
    const anoAtual = new Date().getFullYear();
    const vendasAno = vendas.filter(v => new Date(v.dataVenda).getFullYear() === anoAtual);

    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Relatório de Vendas por Mês (Ano ${anoAtual})`, 10, 15);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 20);

    let finalY = 25;
    
    // Agrupamento por Mês
    const vendasPorMes = vendasAno.reduce((acc, v) => {
        const mes = v.dataVenda.substring(0, 7); // YYYY-MM
        acc[mes] = acc[mes] || { totalVendas: 0, totalComissao: 0, totalCredito: 0 };
        acc[mes].totalVendas += v.valorVenda;
        acc[mes].totalComissao += v.comissaoLoja;
        acc[mes].totalCredito += v.creditoGerado;
        return acc;
    }, {});
    
    const mesesOrdem = Object.keys(vendasPorMes).sort(); // Ordena cronologicamente
    
    const head = [['Mês/Ano', 'Total Vendas', 'Comissão Loja', 'Crédito Gerado']];
    const body = mesesOrdem.map(mesAno => {
        const data = vendasPorMes[mesAno];
        const [ano, mes] = mesAno.split('-');
        const nomeMes = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long' });

        return [
            `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${ano}`, // Capitaliza o nome do mês
            formatarMoeda(data.totalVendas),
            formatarMoeda(data.totalComissao),
            formatarMoeda(data.totalCredito)
        ];
    });
    
     if (body.length === 0) {
        doc.text('Nenhuma venda registrada neste ano.', 10, finalY);
        doc.save(`Relatorio_Vendas_Mes_${anoAtual}.pdf`);
        mostrarNotificacao('Nenhuma venda encontrada para gerar o relatório.', 'aviso');
        return;
    }

    doc.autoTable({
        startY: finalY,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3, textColor: 30 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 10, right: 10 }
    });

    doc.save(`Relatorio_Vendas_Mes_${anoAtual}.pdf`);
    mostrarNotificacao('Relatório de Vendas por Mês gerado!', 'sucesso');
}

function gerarRelatorioCreditosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor = [139, 92, 246];

    doc.setFontSize(18);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Relatório de Saldo de Créditos (A Pagar)`, 10, 15);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 10, 20);

    let finalY = 25;
    
    const head = [['ID', 'Consignatário', 'Crédito Atual', 'Total Vendas Gerado', 'Total Consumido']];
    const body = clientes.map(c => {
        // Encontra as vendas e consumos deste consignatário em TODO o histórico
        const vendasConsig = vendas.filter(v => 
            itens.some(i => i.id === v.itemId && i.consignatarioId === c.id)
        );
        const consumosConsig = consumos.filter(x => x.consignatarioId === c.id);

        const totalCreditoGerado = vendasConsig.reduce((sum, v) => sum + v.creditoGerado, 0);
        const totalConsumido = consumosConsig.reduce((sum, x) => sum + x.valor, 0);

        // Inclui consignatários com saldo > 0 ou com histórico de crédito gerado
        if (c.creditos <= 0 && totalCreditoGerado === 0) return null; 

        return [
            c.id,
            c.nome,
            formatarMoeda(c.creditos), // Saldo atual (Crédito Pendente)
            formatarMoeda(totalCreditoGerado), 
            formatarMoeda(totalConsumido)
        ];
    }).filter(row => row !== null)
      .sort((a, b) => {
          // Ordena por crédito atual (coluna 2 do array) de forma decrescente
          const valA = parseFloat(a[2].replace(/[R$\.]/g, '').replace(',', '.'));
          const valB = parseFloat(b[2].replace(/[R$\.]/g, '').replace(',', '.'));
          return valB - valA; 
      }); 

    
     if (body.length === 0) {
        doc.text('Nenhum consignatário com saldo ou histórico encontrado.', 10, finalY);
        doc.save(`Relatorio_Saldos_Credito.pdf`);
        mostrarNotificacao('Nenhum dado de saldo para gerar o relatório.', 'aviso');
        return;
    }
    
    doc.autoTable({
        startY: finalY,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3, textColor: 30 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        margin: { left: 10, right: 10 }
    });

    const totalPendente = clientes.reduce((sum, c) => sum + c.creditos, 0);
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Total de Créditos Pendentes (A Pagar pela Loja): ${formatarMoeda(totalPendente)}`, 10, doc.autoTable.previous.finalY + 10);

    doc.save(`Relatorio_Saldos_Credito.pdf`);
    mostrarNotificacao('Relatório de Saldo de Créditos gerado!', 'sucesso');
}


// =========================================
// CONFIGURAÇÕES
// =========================================

function renderizarConfiguracoes() {
    document.getElementById('percentualConsignatario').value = configuracoes.percentualConsignatario;
    document.getElementById('percentualLoja').value = configuracoes.percentualLoja;
    document.getElementById('validadeCredito').value = configuracoes.validadeCredito;
    document.getElementById('alertaEstoque').value = configuracoes.alertaEstoque;
}

function salvarConfiguracoes() {
    const pc = parseInt(document.getElementById('percentualConsignatario').value);
    const pl = parseInt(document.getElementById('percentualLoja').value);
    const vc = parseInt(document.getElementById('validadeCredito').value);
    const ae = parseInt(document.getElementById('alertaEstoque').value);

    if (pc + pl !== 100) {
        mostrarNotificacao('A soma dos percentuais do Consignatário e Loja deve ser 100%.', 'erro');
        return;
    }

    configuracoes.percentualConsignatario = pc;
    configuracoes.percentualLoja = pl;
    configuracoes.validadeCredito = vc;
    configuracoes.alertaEstoque = ae;

    salvarDados();
    mostrarNotificacao('Configurações salvas com sucesso!', 'sucesso');
    renderizarDashboard(); // Atualiza o cálculo do dashboard se a comissão mudou
    renderizarItens(); // Atualiza o alerta de estoque
}


// =========================================
// BACKUP E EXPORTAÇÃO
// =========================================
function exportarDados() {
    const dados = {
        bazares,
        itens,
        clientes,
        compradores,
        vendas,
        consumos,
        configuracoes
    };
    const jsonString = JSON.stringify(dados, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bazarplus_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarNotificacao('Dados exportados com sucesso!', 'sucesso');
}

function iniciarImportacao() {
    if (confirm('Atenção! A importação substituirá TODOS os dados atuais. Deseja continuar?')) {
        document.getElementById('importFile').click();
    }
}

function processarImportacao(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            
            // Verifica a estrutura mínima
            if (!dadosImportados.itens || !dadosImportados.clientes || !dadosImportados.vendas) {
                throw new Error("O arquivo JSON não parece ser um backup válido do sistema.");
            }

            bazares = dadosImportados.bazares || [];
            itens = dadosImportados.itens || [];
            clientes = dadosImportados.clientes || [];
            compradores = dadosImportados.compradores || [];
            vendas = dadosImportados.vendas || [];
            consumos = dadosImportados.consumos || [];
            
            // Mescla configurações (mantém as padrão se não estiverem no backup)
            configuracoes = { ...configuracoes, ...(dadosImportados.configuracoes || {}) };

            salvarDados();
            carregarDados(); // Recarrega tudo
            mostrarNotificacao('Importação concluída com sucesso! Os dados foram atualizados.', 'sucesso');

        } catch (error) {
            mostrarNotificacao(`Erro na importação: ${error.message}`, 'erro');
        } finally {
            // Limpa o input file
            document.getElementById('importFile').value = '';
        }
    };
    reader.readAsText(file);
}

function limparTudo() {
    if (confirm('AVISO CRÍTICO! Você tem certeza que deseja APAGAR TODOS os dados? Esta ação é irreversível.')) {
        if (prompt('Para confirmar a exclusão de TODOS os dados, digite a palavra "APAGARTUDO":') === 'APAGARTUDO') {
            localStorage.clear();
            // Reseta variáveis globais
            bazares = [];
            itens = [];
            clientes = [];
            compradores = [];
            vendas = [];
            consumos = [];
            // Recarrega o estado inicial
            carregarDados();
            mostrarNotificacao('TODOS os dados foram APAGADOS e o sistema foi resetado!', 'danger');
        } else {
            mostrarNotificacao('Exclusão cancelada. Palavra de confirmação incorreta.', 'aviso');
        }
    }
}


// =========================================
// INICIALIZAÇÃO
// =========================================

function checkInitializers() {
    // Garante que o campo de data de venda/consumo tenha a data de hoje por padrão
    document.getElementById('dataVenda').value = obterDataHojeISO();
    document.getElementById('dataConsumo').value = obterDataHojeISO();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    
    // Recarrega conteúdo relevante ao mudar de aba
    if (tabId === 'itens') renderizarItens();
    if (tabId === 'consignatarios') renderizarConsignatarios();
    if (tabId === 'vendas') renderizarVendas();
    if (tabId === 'bazares') renderizarBazares();
    if (tabId === 'compradores') renderizarCompradores();
    if (tabId === 'consumo') { 
        renderizarConsumos();
        atualizarSaldoConsumo(); // Garante que o saldo inicial é exibido
    }
    if (tabId === 'dashboard') {
        carregarFiltrosDashboard(); // Atualiza os filtros de mês/bazar/consignatário
        renderizarDashboard();
    }
    if (tabId === 'relatorios') {
        carregarSelectsRelatorios();
    }
    if (tabId === 'configuracoes') {
        renderizarConfiguracoes();
    }
}

function popularSelect(selectId, dataArray, textKey, valueKey, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '';
    
    if (defaultText) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultText;
        select.appendChild(defaultOption);
    }

    dataArray.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        select.appendChild(option);
    });

    // Tenta restaurar o valor, se ainda for válido
    if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
        select.value = currentValue;
    }
}

// Funções de Edição (Stubs - Implementação de Modal seria o ideal)
function editarItem(id) { mostrarNotificacao(`Editar Item #${id} (Funcionalidade em desenvolvimento)`, 'info'); }
function editarConsignatario(id) { mostrarNotificacao(`Editar Consignatário #${id} (Funcionalidade em desenvolvimento)`, 'info'); }
function editarComprador(id) { mostrarNotificacao(`Editar Comprador #${id} (Funcionalidade em desenvolvimento)`, 'info'); }
function editarBazar(id) { mostrarNotificacao(`Editar Bazar #${id} (Funcionalidade em desenvolvimento)`, 'info'); }


// =========================================
// DADOS DE TESTE (PARA FACILITAR O DESENVOLVIMENTO)
// =========================================

function carregarDadosDeExemplo() {
    if (confirm('Tem certeza que deseja carregar os dados de exemplo? Os dados atuais serão substituídos.')) {
        bazares = [
            { id: 1, nome: "Bazar Matriz", endereco: "Rua Exemplo, 123" },
            { id: 2, nome: "Loja Virtual", endereco: "Instagram/Site" }
        ];

        clientes = [
            { id: 1, nome: "Ana Silva", contato: "9999-1111", banco: "Banco A", creditos: 150.00 },
            { id: 2, nome: "Bruno Costa", contato: "9999-2222", banco: "Banco B", creditos: 0.00 },
            { id: 3, nome: "Carla Dantas", contato: "9999-3333", banco: "Banco C", creditos: 0.00 }
        ];

        compradores = [
            { id: 1, nome: "João Souza", contato: "3333-1111", totalVendas: 0 },
            { id: 2, nome: "Maria Oliveira", contato: "3333-2222", totalVendas: 0 }
        ];

        itens = [
            // Itens da Ana
            { id: 101, descricao: "Vestido de Festa", valor: 120.00, consignatarioId: 1, bazarId: 1, categoria: "Moda", status: "Disponível" },
            { id: 102, descricao: "Calça Jeans Skinny", valor: 55.00, consignatarioId: 1, bazarId: 1, categoria: "Moda", status: "Disponível" },
            // Itens do Bruno
            { id: 201, descricao: "Bolsa de Couro", valor: 200.00, consignatarioId: 2, bazarId: 2, categoria: "Acessórios", status: "Disponível" },
            { id: 202, descricao: "Tênis Esportivo", valor: 150.00, consignatarioId: 2, bazarId: 2, categoria: "Calçados", status: "Vendido" }, // Já vendido
             // Itens da Carla (Estoque Baixo)
            { id: 301, descricao: "Colar Banhado", valor: 35.00, consignatarioId: 3, bazarId: 1, categoria: "Joias", status: "Disponível" },
            { id: 302, descricao: "Brinco de Prata", valor: 45.00, consignatarioId: 3, bazarId: 1, categoria: "Joias", status: "Disponível" },
        ];
        
        // Simulação de Vendas
        vendas = [
            // Venda do item 202 (Bruno, Loja Virtual) - Crédito de 80% (150*0.8 = 120)
            { id: 1, itemId: 202, bazarVendaId: 2, valorVenda: 150.00, comissaoLoja: 30.00, creditoGerado: 120.00, dataVenda: '2025-10-01', formaPagamento: 'CartaoCredito', compradorId: 1 }, 
             // Venda de um item da Ana (Bazar Matriz) - Crédito de 80% (100*0.8 = 80)
            { id: 2, itemId: 101, bazarVendaId: 1, valorVenda: 100.00, comissaoLoja: 20.00, creditoGerado: 80.00, dataVenda: '2025-10-15', formaPagamento: 'Pix', compradorId: 2 },
        ];
        // O crédito de Ana é 80, mas ela já tinha 150. Total: 230.
        clientes.find(c => c.id === 1).creditos = 230.00; 
        // O crédito de Bruno é 120.
        clientes.find(c => c.id === 2).creditos = 120.00;

        // Simulação de Consumos/Saques
        consumos = [
            // Saque da Ana (90)
            { id: 1, consignatarioId: 1, valor: 90.00, dataConsumo: '2025-10-20', tipo: 'Saque', observacao: 'Retirada para pagamento' },
        ];
        // Atualiza o saldo final de Ana: 230 - 90 = 140
        clientes.find(c => c.id === 1).creditos = 140.00;

        salvarDados();
        carregarDados();
        mostrarNotificacao('Dados de exemplo carregados com sucesso!', 'sucesso');
    }
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    checkInitializers();

    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+S para salvar (Cadastrar Item/Cliente)
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
