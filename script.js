// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
var dados = {
    itens: [],
    consignatarios: [],
    compradores: [],
    bazares: [],
    vendas: []
};

var vendaAtual = []; // Array para armazenar os itens na venda em andamento

// =========================================
// FUNÇÕES DE PERSISTÊNCIA (Local Storage)
// =========================================
function carregarDados() {
    try {
        var dadosSalvos = localStorage.getItem('bazarPlusDados');
        if (dadosSalvos) {
            dados = JSON.parse(dadosSalvos);
        }
    } catch (e) {
        console.error("Erro ao carregar dados do Local Storage:", e);
    }

    // Inicialização da UI após carregar
    listarItens();
    listarConsignatarios();
    listarCompradores();
    listarBazares();
    
    // Popula selects de itens e vendas
    popularSelects(); 
    
    // Atualiza relatórios iniciais
    atualizarRelatorioGeral();
    gerarChartVendas();
}

function salvarDados() {
    try {
        localStorage.setItem('bazarPlusDados', JSON.stringify(dados));
        // console.log("Dados salvos com sucesso.");
    } catch (e) {
        console.error("Erro ao salvar dados no Local Storage:", e);
        alert("Erro ao salvar dados. Seu navegador pode estar sem espaço ou configurado para bloquear o Local Storage.");
    }
}

// =========================================
// FUNÇÕES DE UTILIDADE E UI
// =========================================

// Alternar Abas
function showTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');

    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (el) {
        el.classList.add('active');
    }

    // Ações específicas ao abrir abas
    if (tabId === 'vendas') {
        document.getElementById('venda-codigo').focus();
    } else if (tabId === 'relatorios') {
        atualizarRelatorioGeral();
        listarRelatorioConsignatarios();
        gerarChartVendas();
    } else {
        // Garante que as listas sejam recarregadas ao trocar de aba de gestão
        listarItens();
        listarConsignatarios();
        listarCompradores();
        listarBazares();
    }
}

// Formatação de Moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

// Popula todos os Selects
function popularSelects() {
    var selectConsignatario = document.getElementById('item-consignatario');
    var selectComprador = document.getElementById('venda-comprador');
    var selectBazarItem = document.getElementById('item-bazar');
    var selectBazarVenda = document.getElementById('venda-bazar');
    var selectRelatorioConsignatario = document.getElementById('relatorio-consignatario-select');

    [selectConsignatario, selectComprador, selectRelatorioConsignatario].forEach(select => {
        select.innerHTML = select === selectComprador ? '<option value="">Selecione o Comprador (Opcional)</option>' : 
                           select === selectRelatorioConsignatario ? '<option value="">Selecione um Consignatário</option>' :
                           '<option value="">Selecione o Consignatário</option>';
    });

    [selectBazarItem, selectBazarVenda].forEach(select => {
        select.innerHTML = select === selectBazarVenda ? '<option value="">Selecione o Bazar Atual</option>' :
                           '<option value="">Selecione o Bazar</option>';
    });

    // Consignatários
    dados.consignatarios.forEach(c => {
        var option = new Option(c.nome, c.id);
        selectConsignatario.add(option.cloneNode(true));
        selectRelatorioConsignatario.add(option.cloneNode(true));
    });

    // Compradores
    dados.compradores.forEach(c => {
        var option = new Option(c.nome, c.id);
        selectComprador.add(option);
    });

    // Bazares
    dados.bazares.forEach(b => {
        var option = new Option(b.nome, b.id);
        selectBazarItem.add(option.cloneNode(true));
        selectBazarVenda.add(option.cloneNode(true));
    });
}

// =========================================
// ITENS - CRUD e Listagem
// =========================================

function adicionarItem() {
    var nome = document.getElementById('item-nome').value.trim();
    var valor = parseFloat(document.getElementById('item-valor').value);
    var consignatarioId = document.getElementById('item-consignatario').value;
    var bazarId = document.getElementById('item-bazar').value;
    var credito = parseInt(document.getElementById('item-credito').value);
    var codigo = document.getElementById('item-codigo').value.trim() || 'I' + Date.now();

    if (!nome || isNaN(valor) || valor <= 0 || !consignatarioId || !bazarId || isNaN(credito) || credito < 0 || credito > 100) {
        alert("Por favor, preencha todos os campos obrigatórios corretamente.");
        return;
    }

    if (dados.itens.some(item => item.codigo === codigo)) {
        alert("O código do item já existe. Por favor, use outro código.");
        return;
    }

    var novoItem = {
        id: Date.now(),
        codigo: codigo,
        nome: nome,
        valor: valor,
        consignatarioId: consignatarioId,
        bazarId: bazarId,
        credito: credito,
        status: 'ativo' // ativo, vendido, inativo
    };

    dados.itens.push(novoItem);
    salvarDados();
    listarItens();
    
    // Limpa campos
    document.getElementById('item-nome').value = '';
    document.getElementById('item-valor').value = '';
    document.getElementById('item-codigo').value = '';
    
    // Opcional: manter consignatario/bazar selecionado para cadastro em lote
    // document.getElementById('item-consignatario').value = '';
    // document.getElementById('item-bazar').value = '';
    
    document.getElementById('item-nome').focus();
    alert("Item cadastrado com sucesso! Código: " + codigo);
}

function listarItens() {
    var tabelaCorpo = document.getElementById('tabela-itens').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    var termoBusca = document.getElementById('itens-search').value.toLowerCase();

    var itensFiltrados = dados.itens.filter(item => {
        var nomeConsignatario = dados.consignatarios.find(c => c.id == item.consignatarioId)?.nome || 'Desconhecido';
        return item.nome.toLowerCase().includes(termoBusca) ||
               item.codigo.toLowerCase().includes(termoBusca) ||
               nomeConsignatario.toLowerCase().includes(termoBusca);
    }).sort((a, b) => a.id - b.id);

    itensFiltrados.forEach(item => {
        var consignatarioNome = dados.consignatarios.find(c => c.id == item.consignatarioId)?.nome || 'Desconhecido';
        var bazarNome = dados.bazares.find(b => b.id == item.bazarId)?.nome || 'Desconhecido';
        
        var statusClass = '';
        var statusTexto = '';
        if (item.status === 'ativo') {
            statusClass = 'status-ativo';
            statusTexto = 'Ativo';
        } else if (item.status === 'vendido') {
            statusClass = 'status-vendido';
            statusTexto = 'Vendido';
        } else {
            statusClass = 'status-inativo';
            statusTexto = 'Inativo';
        }

        var linha = `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nome}</td>
                <td>${formatarMoeda(item.valor)}</td>
                <td>${consignatarioNome}</td>
                <td>${bazarNome}</td>
                <td>${item.credito}%</td>
                <td><span class="status ${statusClass}">${statusTexto}</span></td>
                <td>
                    <button class="icon-button" onclick="editarItem('${item.codigo}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="icon-button" onclick="excluirItem('${item.codigo}')" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });
}

function excluirItem(codigo) {
    if (confirm(`Tem certeza que deseja excluir o item com código ${codigo}? Isso não pode ser desfeito.`)) {
        var index = dados.itens.findIndex(item => item.codigo === codigo);
        if (index > -1) {
            dados.itens.splice(index, 1);
            salvarDados();
            listarItens();
            alert("Item excluído com sucesso.");
        }
    }
}

function editarItem(codigo) {
    var item = dados.itens.find(i => i.codigo === codigo);
    if (!item) return;

    var novoNome = prompt("Novo Nome:", item.nome);
    if (novoNome === null) return;
    
    var novoValor = prompt("Novo Valor (R$):", item.valor);
    if (novoValor === null) return;
    novoValor = parseFloat(novoValor);

    var novoCredito = prompt("Novo Crédito (%):", item.credito);
    if (novoCredito === null) return;
    novoCredito = parseInt(novoCredito);
    
    if (novoNome.trim() && !isNaN(novoValor) && novoValor > 0 && !isNaN(novoCredito) && novoCredito >= 0 && novoCredito <= 100) {
        item.nome = novoNome.trim();
        item.valor = novoValor;
        item.credito = novoCredito;
        salvarDados();
        listarItens();
        alert("Item atualizado com sucesso!");
    } else {
        alert("Entrada inválida. As alterações não foram salvas.");
    }
}


// =========================================
// CONSIGNATÁRIOS - CRUD e Listagem
// =========================================

function adicionarConsignatario() {
    var nome = document.getElementById('consignatario-nome').value.trim();
    var contato = document.getElementById('consignatario-contato').value.trim();
    var pix = document.getElementById('consignatario-pix').value.trim();

    if (!nome) {
        alert("O nome do consignatário é obrigatório.");
        return;
    }

    var novoConsignatario = {
        id: Date.now(),
        nome: nome,
        contato: contato,
        pix: pix
    };

    dados.consignatarios.push(novoConsignatario);
    salvarDados();
    listarConsignatarios();
    popularSelects();
    
    document.getElementById('consignatario-nome').value = '';
    document.getElementById('consignatario-contato').value = '';
    document.getElementById('consignatario-pix').value = '';
    document.getElementById('consignatario-nome').focus();
    alert("Consignatário cadastrado com sucesso.");
}

function listarConsignatarios() {
    var tabelaCorpo = document.getElementById('tabela-consignatarios').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    var termoBusca = document.getElementById('consignatario-search').value.toLowerCase();

    dados.consignatarios.filter(c => c.nome.toLowerCase().includes(termoBusca))
    .sort((a, b) => a.id - b.id)
    .forEach(consignatario => {
        var itensAtivos = dados.itens.filter(item => item.consignatarioId == consignatario.id && item.status === 'ativo').length;
        
        var linha = `
            <tr>
                <td>C${consignatario.id}</td>
                <td>${consignatario.nome}</td>
                <td>${consignatario.contato || '-'}</td>
                <td>${consignatario.pix || '-'}</td>
                <td>${itensAtivos}</td>
                <td>
                    <button class="icon-button" onclick="editarConsignatario(${consignatario.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="icon-button" onclick="excluirConsignatario(${consignatario.id})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });
}

function excluirConsignatario(id) {
    if (dados.itens.some(item => item.consignatarioId == id && item.status !== 'vendido')) {
        alert("Não é possível excluir: este consignatário possui itens ativos ou pendentes de venda.");
        return;
    }
    
    if (confirm("Tem certeza que deseja excluir este consignatário?")) {
        var index = dados.consignatarios.findIndex(c => c.id == id);
        if (index > -1) {
            dados.consignatarios.splice(index, 1);
            salvarDados();
            listarConsignatarios();
            popularSelects();
            alert("Consignatário excluído com sucesso.");
        }
    }
}

function editarConsignatario(id) {
    var c = dados.consignatarios.find(con => con.id == id);
    if (!c) return;
    
    var novoNome = prompt("Novo Nome:", c.nome);
    if (novoNome === null) return;
    
    var novoContato = prompt("Novo Contato:", c.contato);
    if (novoContato === null) return;
    
    var novoPix = prompt("Nova Chave PIX:", c.pix);
    if (novoPix === null) return;

    if (novoNome.trim()) {
        c.nome = novoNome.trim();
        c.contato = novoContato.trim();
        c.pix = novoPix.trim();
        salvarDados();
        listarConsignatarios();
        popularSelects();
        alert("Consignatário atualizado com sucesso!");
    } else {
        alert("O nome é obrigatório.");
    }
}

// =========================================
// COMPRADORES - CRUD e Listagem
// =========================================

function adicionarComprador() {
    var nome = document.getElementById('comprador-nome').value.trim();
    var contato = document.getElementById('comprador-contato').value.trim();

    if (!nome) {
        alert("O nome do comprador é obrigatório.");
        return;
    }

    var novoComprador = {
        id: Date.now(),
        nome: nome,
        contato: contato
    };

    dados.compradores.push(novoComprador);
    salvarDados();
    listarCompradores();
    popularSelects();
    
    document.getElementById('comprador-nome').value = '';
    document.getElementById('comprador-contato').value = '';
    document.getElementById('comprador-nome').focus();
    alert("Comprador cadastrado com sucesso.");
}

function listarCompradores() {
    var tabelaCorpo = document.getElementById('tabela-compradores').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    var termoBusca = document.getElementById('comprador-search').value.toLowerCase();

    dados.compradores.filter(c => c.nome.toLowerCase().includes(termoBusca))
    .sort((a, b) => a.id - b.id)
    .forEach(comprador => {
        // Calcular total gasto pelo comprador
        var totalGasto = dados.vendas
            .filter(v => v.compradorId == comprador.id)
            .reduce((total, venda) => total + venda.total, 0);

        var linha = `
            <tr>
                <td>P${comprador.id}</td>
                <td>${comprador.nome}</td>
                <td>${comprador.contato || '-'}</td>
                <td>${formatarMoeda(totalGasto)}</td>
                <td>
                    <button class="icon-button" onclick="editarComprador(${comprador.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="icon-button" onclick="excluirComprador(${comprador.id})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });
}

function excluirComprador(id) {
    if (dados.vendas.some(v => v.compradorId == id)) {
        alert("Não é possível excluir: este comprador está associado a vendas registradas.");
        return;
    }
    
    if (confirm("Tem certeza que deseja excluir este comprador?")) {
        var index = dados.compradores.findIndex(c => c.id == id);
        if (index > -1) {
            dados.compradores.splice(index, 1);
            salvarDados();
            listarCompradores();
            popularSelects();
            alert("Comprador excluído com sucesso.");
        }
    }
}

function editarComprador(id) {
    var c = dados.compradores.find(comp => comp.id == id);
    if (!c) return;
    
    var novoNome = prompt("Novo Nome:", c.nome);
    if (novoNome === null) return;
    
    var novoContato = prompt("Novo Contato:", c.contato);
    if (novoContato === null) return;

    if (novoNome.trim()) {
        c.nome = novoNome.trim();
        c.contato = novoContato.trim();
        salvarDados();
        listarCompradores();
        popularSelects();
        alert("Comprador atualizado com sucesso!");
    } else {
        alert("O nome é obrigatório.");
    }
}

// =========================================
// BAZARES - CRUD e Listagem
// =========================================

function criarBazar() {
    var nome = document.getElementById('bazar-nome').value.trim();

    if (!nome) {
        alert("O nome do bazar é obrigatório.");
        return;
    }
    
    if (dados.bazares.some(b => b.nome.toLowerCase() === nome.toLowerCase())) {
        alert("Já existe um bazar com esse nome.");
        return;
    }

    var novoBazar = {
        id: Date.now(),
        nome: nome,
        dataCriacao: new Date().toLocaleDateString('pt-BR')
    };

    dados.bazares.push(novoBazar);
    salvarDados();
    listarBazares();
    popularSelects();
    
    document.getElementById('bazar-nome').value = '';
    document.getElementById('bazar-nome').focus();
    alert("Bazar criado com sucesso.");
}

function listarBazares() {
    var tabelaCorpo = document.getElementById('tabela-bazares').querySelector('tbody');
    tabelaCorpo.innerHTML = '';

    dados.bazares.sort((a, b) => b.id - a.id) // Mais recentes primeiro
    .forEach(bazar => {
        var itensCadastrados = dados.itens.filter(item => item.bazarId == bazar.id).length;
        
        var linha = `
            <tr>
                <td>B${bazar.id}</td>
                <td>${bazar.nome}</td>
                <td>${bazar.dataCriacao}</td>
                <td>${itensCadastrados}</td>
                <td>
                    <button class="icon-button" onclick="excluirBazar(${bazar.id})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });
}

function excluirBazar(id) {
    if (dados.itens.some(item => item.bazarId == id)) {
        alert("Não é possível excluir: este bazar possui itens cadastrados.");
        return;
    }
    
    if (confirm("Tem certeza que deseja excluir este bazar?")) {
        var index = dados.bazares.findIndex(b => b.id == id);
        if (index > -1) {
            dados.bazares.splice(index, 1);
            salvarDados();
            listarBazares();
            popularSelects();
            alert("Bazar excluído com sucesso.");
        }
    }
}


// =========================================
// VENDAS - Processamento
// =========================================

function adicionarItemVenda() {
    var codigo = document.getElementById('venda-codigo').value.trim();
    var feedback = document.getElementById('venda-feedback');
    var infoBox = document.getElementById('venda-item-info');

    feedback.className = 'feedback-text';
    feedback.textContent = '';
    infoBox.innerHTML = '';

    if (!codigo) {
        feedback.classList.add('error');
        feedback.textContent = 'Digite um código de item válido.';
        return;
    }

    var item = dados.itens.find(i => i.codigo === codigo);

    if (!item) {
        feedback.classList.add('error');
        feedback.textContent = `Item com código "${codigo}" não encontrado.`;
        return;
    }

    if (item.status === 'vendido') {
        feedback.classList.add('error');
        feedback.textContent = `Item "${item.nome}" já foi vendido.`;
        return;
    }
    
    if (vendaAtual.some(i => i.codigo === codigo)) {
        feedback.classList.add('error');
        feedback.textContent = `Item "${item.nome}" já está na lista de venda.`;
        return;
    }

    // Se o item é válido e ativo, adiciona à lista
    vendaAtual.push(item);
    
    // Feedback
    feedback.classList.add('success');
    feedback.textContent = `Item "${item.nome}" adicionado com sucesso.`;
    
    // Atualiza info box
    var consignatarioNome = dados.consignatarios.find(c => c.id == item.consignatarioId)?.nome || 'Desconhecido';
    infoBox.innerHTML = `
        <p><strong>Nome:</strong> ${item.nome}</p>
        <p><strong>Valor:</strong> ${formatarMoeda(item.valor)}</p>
        <p><strong>Consignatário:</strong> ${consignatarioNome}</p>
    `;

    document.getElementById('venda-codigo').value = '';
    document.getElementById('venda-codigo').focus();
    
    listarItensVenda();
}

function listarItensVenda() {
    var tabelaCorpo = document.getElementById('tabela-venda-itens').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    var total = 0;

    vendaAtual.forEach((item, index) => {
        total += item.valor;
        
        var linha = `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nome}</td>
                <td>${formatarMoeda(item.valor)}</td>
                <td>
                    <button class="icon-button btn-danger" onclick="removerItemVenda(${index})" title="Remover"><i class="fas fa-times"></i></button>
                </td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });

    document.getElementById('venda-total').textContent = formatarMoeda(total);
}

function removerItemVenda(index) {
    if (index >= 0 && index < vendaAtual.length) {
        var nomeItem = vendaAtual[index].nome;
        vendaAtual.splice(index, 1);
        listarItensVenda();
        
        var feedback = document.getElementById('venda-feedback');
        feedback.className = 'feedback-text success';
        feedback.textContent = `Item "${nomeItem}" removido da lista.`;
    }
}

function limparVenda() {
    if (confirm("Tem certeza que deseja limpar a lista de venda atual?")) {
        vendaAtual = [];
        listarItensVenda();
        document.getElementById('venda-feedback').className = 'feedback-text';
        document.getElementById('venda-feedback').textContent = '';
        document.getElementById('venda-item-info').innerHTML = '';
        document.getElementById('venda-codigo').focus();
        
        // Resetar selects
        document.getElementById('venda-comprador').value = '';
        document.getElementById('venda-bazar').value = '';
        document.getElementById('venda-forma-pagamento').value = '';
        
        alert("Lista de venda limpa.");
    }
}

function finalizarVenda() {
    if (vendaAtual.length === 0) {
        alert("A lista de venda está vazia. Adicione itens antes de finalizar.");
        return;
    }

    var compradorId = document.getElementById('venda-comprador').value || null;
    var bazarId = document.getElementById('venda-bazar').value;
    var formaPagamento = document.getElementById('venda-forma-pagamento').value;

    if (!bazarId || !formaPagamento) {
        alert("Por favor, selecione o Bazar e a Forma de Pagamento.");
        return;
    }

    var totalVenda = vendaAtual.reduce((sum, item) => sum + item.valor, 0);

    // 1. Criar Objeto Venda
    var novaVenda = {
        id: Date.now(),
        data: new Date().toISOString(),
        bazarId: bazarId,
        compradorId: compradorId,
        formaPagamento: formaPagamento,
        total: totalVenda,
        itensVendidos: vendaAtual.map(item => ({
            codigo: item.codigo,
            valor: item.valor,
            credito: item.credito,
            consignatarioId: item.consignatarioId
        }))
    };

    // 2. Atualizar Status dos Itens para 'vendido'
    novaVenda.itensVendidos.forEach(vItem => {
        var itemIndex = dados.itens.findIndex(i => i.codigo === vItem.codigo);
        if (itemIndex > -1) {
            dados.itens[itemIndex].status = 'vendido';
            dados.itens[itemIndex].dataVenda = novaVenda.data;
            dados.itens[itemIndex].vendaId = novaVenda.id;
        }
    });

    // 3. Salvar Venda e Dados
    dados.vendas.push(novaVenda);
    salvarDados();

    // 4. Limpar e Dar Feedback
    vendaAtual = [];
    listarItensVenda();
    document.getElementById('venda-feedback').className = 'feedback-text success';
    document.getElementById('venda-feedback').textContent = `Venda finalizada com sucesso! Total: ${formatarMoeda(totalVenda)}`;
    document.getElementById('venda-item-info').innerHTML = '';
    
    // Resetar selects
    document.getElementById('venda-comprador').value = '';
    document.getElementById('venda-bazar').value = '';
    document.getElementById('venda-forma-pagamento').value = '';

    // Atualiza UI de outras abas
    listarItens(); 
    atualizarRelatorioGeral();
    gerarChartVendas();
    
    alert(`Venda no valor de ${formatarMoeda(totalVenda)} registrada!`);
}

// =========================================
// RELATÓRIOS
// =========================================

function atualizarRelatorioGeral() {
    var vendasDoBazarAtivo = dados.vendas; // Considera todas as vendas para o geral, mas pode ser filtrado por Bazar.
    
    // Exemplo de como selecionar um bazar ativo se houver lógica para isso.
    // var bazarAtivoId = document.getElementById('venda-bazar').value;
    // var vendasDoBazarAtivo = dados.vendas.filter(v => v.bazarId == bazarAtivoId);

    var totalVendido = vendasDoBazarAtivo.reduce((sum, v) => sum + v.itensVendidos.length, 0);
    var arrecadadoBruto = vendasDoBazarAtivo.reduce((sum, v) => sum + v.total, 0);
    var devidoConsignatarios = 0;

    vendasDoBazarAtivo.forEach(venda => {
        venda.itensVendidos.forEach(itemVendido => {
            // Crédito Consignatário = (Valor * Crédito %)
            devidoConsignatarios += itemVendido.valor * (itemVendido.credito / 100);
        });
    });
    
    var lucroBazar = arrecadadoBruto - devidoConsignatarios;
    
    document.getElementById('relatorio-bazar-ativo').textContent = dados.bazares.length > 0 ? dados.bazares[dados.bazares.length - 1].nome : 'Nenhum Cadastrado';
    document.getElementById('relatorio-total-vendido').textContent = totalVendido;
    document.getElementById('relatorio-arrecadado-bruto').textContent = formatarMoeda(arrecadadoBruto);
    document.getElementById('relatorio-devido-consignatarios').textContent = formatarMoeda(devidoConsignatarios);
    document.getElementById('relatorio-lucro-bazar').textContent = formatarMoeda(lucroBazar);
}

function listarRelatorioConsignatarios() {
    var tabelaCorpo = document.getElementById('tabela-relatorio-consignatarios').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    
    var totalDevidoPorConsignatario = {};

    dados.vendas.forEach(venda => {
        venda.itensVendidos.forEach(itemVendido => {
            var creditoConsignatario = itemVendido.valor * (itemVendido.credito / 100);
            var consId = itemVendido.consignatarioId;
            
            if (!totalDevidoPorConsignatario[consId]) {
                totalDevidoPorConsignatario[consId] = 0;
            }
            totalDevidoPorConsignatario[consId] += creditoConsignatario;
        });
    });

    Object.keys(totalDevidoPorConsignatario).forEach(consignatarioId => {
        var consignatario = dados.consignatarios.find(c => c.id == consignatarioId);
        if (consignatario) {
             var linha = `
                <tr>
                    <td>${consignatario.nome}</td>
                    <td>${formatarMoeda(totalDevidoPorConsignatario[consignatarioId])}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="liquidarCredito(${consignatarioId})">Liquidar</button>
                    </td>
                </tr>
            `;
            tabelaCorpo.innerHTML += linha;
        }
    });
}

function listarItensVendidosPorConsignatario() {
    var consignatarioId = document.getElementById('relatorio-consignatario-select').value;
    var tabelaCorpo = document.getElementById('tabela-itens-vendidos-detalhe').querySelector('tbody');
    tabelaCorpo.innerHTML = '';
    
    if (!consignatarioId) return;

    var itensVendidos = [];
    dados.vendas.forEach(venda => {
        venda.itensVendidos.forEach(itemVendido => {
            if (itemVendido.consignatarioId == consignatarioId) {
                var itemOriginal = dados.itens.find(i => i.codigo === itemVendido.codigo);
                var comprador = dados.compradores.find(c => c.id == venda.compradorId)?.nome || 'Não Identificado';
                
                itensVendidos.push({
                    codigo: itemVendido.codigo,
                    nome: itemOriginal ? itemOriginal.nome : 'Item Excluído',
                    valorVenda: itemVendido.valor,
                    credito: itemVendido.credito,
                    creditoConsignatario: itemVendido.valor * (itemVendido.credito / 100),
                    comprador: comprador
                });
            }
        });
    });
    
    itensVendidos.forEach(item => {
        var linha = `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nome}</td>
                <td>${formatarMoeda(item.valorVenda)}</td>
                <td>${item.credito}%</td>
                <td>${formatarMoeda(item.creditoConsignatario)}</td>
                <td>${item.comprador}</td>
            </tr>
        `;
        tabelaCorpo.innerHTML += linha;
    });
}

function liquidarCredito(consignatarioId) {
    var consignatario = dados.consignatarios.find(c => c.id == consignatarioId);
    if (!consignatario) return;
    
    var totalDevido = 0;
    
    // Calcula o total devido (lógica repetida do listarRelatorioConsignatarios, pode ser otimizado)
    dados.vendas.forEach(venda => {
        venda.itensVendidos.forEach(itemVendido => {
            if (itemVendido.consignatarioId == consignatarioId) {
                totalDevido += itemVendido.valor * (itemVendido.credito / 100);
            }
        });
    });

    if (totalDevido === 0) {
        alert(`${consignatario.nome} não possui créditos a liquidar.`);
        return;
    }

    if (confirm(`Confirmar liquidação de ${formatarMoeda(totalDevido)} para ${consignatario.nome}? \nATENÇÃO: Este é apenas um registro visual. Nenhuma venda é apagada.`)) {
        // Ação de liquidação (Exemplo: poderia mover os itens/vendas liquidadas para um array de 'liquidadas'
        // ou adicionar uma nova estrutura para registrar o pagamento.
        // Por enquanto, apenas um alerta para confirmar o procedimento.
        alert(`Pagamento de ${formatarMoeda(totalDevido)} para ${consignatario.nome} registrado (Simulação).`);
        listarRelatorioConsignatarios(); // Recarrega a lista
    }
}

// =========================================
// GRÁFICOS (Chart.js)
// =========================================
var vendasChartInstance = null; // Variável para a instância do Chart

function gerarChartVendas() {
    var ctx = document.getElementById('vendasChart').getContext('2d');
    
    var vendasPorFormaPagamento = dados.vendas.reduce((acc, venda) => {
        acc[venda.formaPagamento] = (acc[venda.formaPagamento] || 0) + venda.total;
        return acc;
    }, {});
    
    var labels = Object.keys(vendasPorFormaPagamento).map(key => key.charAt(0).toUpperCase() + key.slice(1));
    var dataValues = Object.values(vendasPorFormaPagamento);

    // Destrói a instância anterior se existir
    if (vendasChartInstance) {
        vendasChartInstance.destroy();
    }
    
    vendasChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas por Forma de Pagamento (R$)',
                data: dataValues,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)', // Dinheiro
                    'rgba(255, 99, 132, 0.6)', // Cartão
                    'rgba(54, 162, 235, 0.6)'  // PIX
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição de Vendas por Forma de Pagamento'
                }
            }
        }
    });
}

// =========================================
// CONFIGURAÇÕES (Backup e Limpeza)
// =========================================

function exportarDados() {
    // Clona os dados para não alterar o objeto original
    var dadosExportar = JSON.parse(JSON.stringify(dados)); 

    // Cria a string JSON formatada
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosExportar, null, 2));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `bazarplus_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
    alert("Backup exportado com sucesso!");
}

function importarDados() {
    var fileInput = document.getElementById('import-file');
    var file = fileInput.files[0];
    
    if (!file) {
        alert("Por favor, selecione um arquivo JSON para importar.");
        return;
    }

    if (!confirm("ATENÇÃO: Importar dados substituirá todos os dados atuais. Deseja continuar?")) {
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var importedData = JSON.parse(e.target.result);
            
            // Validação mínima para garantir que é o formato esperado
            if (importedData.itens && importedData.consignatarios) {
                dados = importedData;
                salvarDados();
                carregarDados(); // Recarrega toda a UI
                alert("Dados importados com sucesso!");
            } else {
                alert("O arquivo não parece ser um backup válido do BazarPlus.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao processar o arquivo. Certifique-se de que é um JSON válido.");
        }
    };
    reader.readAsText(file);
}

function limparTudo() {
    if (confirm("ATENÇÃO: Tem certeza que deseja apagar TODOS os dados? Esta ação é irreversível.")) {
        localStorage.removeItem('bazarPlusDados');
        // Resetar o objeto de dados na memória
        dados = {
            itens: [],
            consignatarios: [],
            compradores: [],
            bazares: [],
            vendas: []
        };
        carregarDados(); // Recarrega a UI com dados vazios
        alert("Todos os dados foram apagados com sucesso.");
    }
}

function checkInitializers() {
    if (dados.bazares.length === 0) {
        document.getElementById('relatorio-bazar-ativo').textContent = 'Nenhum Cadastrado. Considere Inicializar.';
    }
}

function executarInicializador() {
    if (confirm("Isto irá adicionar dados de exemplo. Deseja continuar?")) {
        // 1. Bazar Inicial
        if (!dados.bazares.some(b => b.nome === 'Bazar Inicial')) {
            dados.bazares.push({
                id: 1000,
                nome: 'Bazar Inicial',
                dataCriacao: new Date().toLocaleDateString('pt-BR')
            });
        }
        
        // 2. Consignatário de Exemplo
        if (!dados.consignatarios.some(c => c.nome === 'Alice Fornecedora')) {
            dados.consignatarios.push({
                id: 100,
                nome: 'Alice Fornecedora',
                contato: '(11) 98765-4321',
                pix: 'alice@fornecedora.com'
            });
        }
        
        // 3. Comprador de Exemplo
        if (!dados.compradores.some(c => c.nome === 'Pedro Comprador')) {
            dados.compradores.push({
                id: 500,
                nome: 'Pedro Comprador',
                contato: '(21) 91234-5678'
            });
        }
        
        // 4. Item de Exemplo
        if (!dados.itens.some(i => i.codigo === 'I101')) {
            dados.itens.push({
                id: 101,
                codigo: 'I101',
                nome: 'Vestido Florido',
                valor: 80.00,
                consignatarioId: 100,
                bazarId: 1000,
                credito: 50,
                status: 'ativo'
            });
            dados.itens.push({
                id: 102,
                codigo: 'I102',
                nome: 'Calça Jeans',
                valor: 120.00,
                consignatarioId: 100,
                bazarId: 1000,
                credito: 60,
                status: 'ativo'
            });
        }

        salvarDados();
        carregarDados();
        alert("Dados iniciais (Bazar, Consignatário, Comprador e Itens) criados com sucesso!");
    }
}

// =========================================
// PDF REPORTS (jspdf + jspdf-autotable)
// =========================================

function gerarRelatorioVendasPDF() {
    if (typeof window.jspdf === 'undefined') {
        alert("Biblioteca jspdf não carregada.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Relatório Geral de Vendas - BazarPlus", 14, 20);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 26);
    
    const tableColumn = ["ID Venda", "Data", "Bazar", "Comprador", "Total", "Forma Pgto", "Itens"];
    const tableRows = [];

    dados.vendas.forEach(venda => {
        const bazarNome = dados.bazares.find(b => b.id == venda.bazarId)?.nome || 'Desconhecido';
        const compradorNome = dados.compradores.find(c => c.id == venda.compradorId)?.nome || 'Não Identificado';
        
        tableRows.push([
            `V${venda.id}`,
            new Date(venda.data).toLocaleDateString('pt-BR'),
            bazarNome,
            compradorNome,
            formatarMoeda(venda.total),
            venda.formaPagamento.charAt(0).toUpperCase() + venda.formaPagamento.slice(1),
            venda.itensVendidos.length
        ]);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });
    doc.save(`relatorio_vendas_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert("PDF do Relatório de Vendas gerado!");
}

function gerarRelatorioConsignatarioPDF() {
    const consignatarioId = document.getElementById('relatorio-consignatario-select').value;
    const consignatario = dados.consignatarios.find(c => c.id == consignatarioId);

    if (!consignatario) {
        alert("Por favor, selecione um Consignatário.");
        return;
    }
    
    if (typeof window.jspdf === 'undefined') {
        alert("Biblioteca jspdf não carregada.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Relatório Detalhado - ${consignatario.nome}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`PIX: ${consignatario.pix || 'Não Informado'} | Contato: ${consignatario.contato || 'Não Informado'}`, 14, 26);

    const tableColumn = ["Cód.", "Item", "Valor Venda", "% Crédito", "Crédito Consignatário", "Comprador"];
    const tableRows = [];
    let totalDevido = 0;

    dados.vendas.forEach(venda => {
        venda.itensVendidos.forEach(itemVendido => {
            if (itemVendido.consignatarioId == consignatarioId) {
                const itemOriginal = dados.itens.find(i => i.codigo === itemVendido.codigo);
                const comprador = dados.compradores.find(c => c.id == venda.compradorId)?.nome || 'Não Identificado';
                const creditoConsignatario = itemVendido.valor * (itemVendido.credito / 100);
                totalDevido += creditoConsignatario;

                tableRows.push([
                    itemVendido.codigo,
                    itemOriginal ? itemOriginal.nome : 'Item Excluído',
                    formatarMoeda(itemVendido.valor),
                    `${itemVendido.credito}%`,
                    formatarMoeda(creditoConsignatario),
                    comprador
                ]);
            }
        });
    });

    doc.autoTable(tableColumn, tableRows, { startY: 35 });

    doc.setFontSize(12);
    doc.text(`Total Devido: ${formatarMoeda(totalDevido)}`, 14, doc.autoTable.previous.finalY + 10);

    doc.save(`relatorio_${consignatario.nome.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert(`PDF do Relatório de ${consignatario.nome} gerado!`);
}


// =========================================
// INICIALIZAÇÃO E ATALHOS
// =========================================

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
