/* =====================================================================
   SISTEMA BAZARPLUS – scripts.js (CORRIGIDO E COMPATÍVEL COM HTML)
   ===================================================================== */

/* ---------------------------------------------------------
   1. VARIÁVEIS GLOBAIS
--------------------------------------------------------- */
let itens = [];
let vendas = [];
let bazares = [];
let consignatarios = [];
let compradores = [];
let consumosCreditos = [];

let bazarAtual = null;

let configuracoes = {
    percentualConsignatario: 80,
    percentualLoja: 20,
    alertaEstoque: 5,
    validadeCredito: 6
};

/* ---------------------------------------------------------
   2. SALVAR / CARREGAR DO LOCALSTORAGE
--------------------------------------------------------- */
function salvarDados() {
    localStorage.setItem("bazarplus_db", JSON.stringify({
        itens,
        vendas,
        bazares,
        consignatarios,
        compradores,
        consumosCreditos,
        configuracoes,
        bazarAtual
    }));
}

function carregarDados() {
    const db = localStorage.getItem("bazarplus_db");
    if (!db) return;

    const dados = JSON.parse(db);

    itens = dados.itens || [];
    vendas = dados.vendas || [];
    bazares = dados.bazares || [];
    consignatarios = dados.consignatarios || [];
    compradores = dados.compradores || [];
    consumosCreditos = dados.consumosCreditos || [];
    configuracoes = dados.configuracoes || configuracoes;
    bazarAtual = dados.bazarAtual || null;
}

/* ---------------------------------------------------------
   3. INICIALIZAÇÃO GERAL
--------------------------------------------------------- */
function init() {
    carregarDados();
    carregarConfiguracoes();
    renderizarBazares();
    renderizarItens();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarCompradores();
    renderizarOpcoesSelects();
    renderizarDashboard();
    renderizarConsumosCreditos();
    
    // Configurar data atual para formulários
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('bazarData').value = hoje;
    document.getElementById('vendaData').value = hoje;
    document.getElementById('consumoData').value = hoje;
}

/* ---------------------------------------------------------
   4. FUNÇÕES AUXILIARES
--------------------------------------------------------- */
function gerarId() {
    return Math.floor(Math.random() * 1000000000);
}

function formatarMoeda(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(d) {
    return new Date(d).toLocaleDateString("pt-BR");
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const area = document.getElementById('notification-area');
    const notificacao = document.createElement('div');
    notificacao.className = `notification ${tipo}`;
    notificacao.innerHTML = `
        <i class="fas fa-${tipo === 'sucesso' ? 'check' : tipo === 'erro' ? 'exclamation-triangle' : 'info'}-circle"></i>
        ${mensagem}
    `;
    
    area.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => {
            area.removeChild(notificacao);
        }, 400);
    }, 4000);
}

/* ============================================================
   5. BAZARES - CORRIGIDO PARA HTML
============================================================ */

function criarBazar() {
    const nome = document.getElementById("bazarNome").value.trim();
    const data = document.getElementById("bazarData").value;
    const tema = document.getElementById("bazarTema").value.trim();
    const observacao = document.getElementById("bazarObservacao").value.trim();

    if (!nome || !data) {
        mostrarNotificacao("Preencha nome e data do bazar!", "erro");
        return;
    }

    const bazar = {
        id: gerarId(),
        nome,
        inicio: data,
        tema,
        observacao,
        status: "ativo"
    };

    bazares.push(bazar);
    bazarAtual = bazar.id;

    salvarDados();
    renderizarBazares();
    renderizarOpcoesSelects();

    document.getElementById("bazarNome").value = "";
    document.getElementById("bazarData").value = "";
    document.getElementById("bazarTema").value = "";
    document.getElementById("bazarObservacao").value = "";
    
    mostrarNotificacao("Bazar criado com sucesso!", "sucesso");
}

function limparFormularioBazar() {
    document.getElementById("bazarNome").value = "";
    document.getElementById("bazarData").value = "";
    document.getElementById("bazarTema").value = "";
    document.getElementById("bazarObservacao").value = "";
}

function renderizarBazares() {
    const tbody = document.getElementById("listaBazares");
    if (!tbody) return;

    tbody.innerHTML = "";

    bazares.forEach(b => {
        const itensBazar = itens.filter(i => i.bazarId === b.id).length;
        const vendidos = itens.filter(i => i.bazarId === b.id && i.status === "vendido").length;
        const totalVendas = vendas.filter(v => v.bazarId === b.id)
            .reduce((acc, v) => acc + v.precoVenda, 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.nome}</td>
            <td>${formatarData(b.inicio)}</td>
            <td>${b.tema || '-'}</td>
            <td>${itensBazar}</td>
            <td>${vendidos}</td>
            <td>${formatarMoeda(totalVendas)}</td>
            <td><span class="status-badge ${b.status}">${b.status}</span></td>
            <td class="table-actions">
                <button onclick="definirBazarAtual(${b.id})" title="Selecionar">
                    <i class="fas fa-hand-pointer"></i>
                </button>
                <button onclick="editarBazar(${b.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirBazar(${b.id})" title="Excluir" class="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function definirBazarAtual(id) {
    bazarAtual = id;
    salvarDados();
    renderizarBazares();
    renderizarDashboard();
    mostrarNotificacao("Bazar selecionado com sucesso!", "sucesso");
}

function excluirBazar(id) {
    if (!confirm("Tem certeza que deseja excluir este bazar?")) return;
    
    bazares = bazares.filter(b => b.id !== id);
    if (bazarAtual === id) {
        bazarAtual = null;
    }
    
    salvarDados();
    renderizarBazares();
    renderizarOpcoesSelects();
    mostrarNotificacao("Bazar excluído com sucesso!", "sucesso");
}

/* ============================================================
   6. ITENS - CORRIGIDO PARA HTML
============================================================ */

function adicionarItem() {
    const descricao = document.getElementById("itemDescricao").value.trim();
    const categoria = document.getElementById("itemCategoria").value;
    const preco = parseFloat(document.getElementById("itemPreco").value);
    const tamanho = document.getElementById("itemTamanho").value.trim();
    const marca = document.getElementById("itemMarca").value.trim();
    const estado = document.getElementById("itemEstado").value;
    const consignatarioId = document.getElementById("itemConsignatario").value;
    const observacao = document.getElementById("itemObservacao").value.trim();

    if (!descricao || !consignatarioId || isNaN(preco) || preco <= 0) {
        mostrarNotificacao("Preencha descrição, preço e consignatário.", "erro");
        return;
    }

    if (!bazarAtual) {
        mostrarNotificacao("Selecione um bazar antes de adicionar itens.", "erro");
        return;
    }

    const item = {
        id: gerarId(),
        descricao,
        categoria,
        preco,
        tamanho,
        marca,
        estado,
        consignatarioId: parseInt(consignatarioId),
        observacao,
        bazarId: bazarAtual,
        status: "disponivel",
        dataCadastro: new Date().toISOString()
    };

    itens.push(item);
    salvarDados();
    renderizarItens();
    renderizarOpcoesSelects();
    renderizarDashboard();

    limparFormularioItem();
    mostrarNotificacao("Item adicionado com sucesso!", "sucesso");
}

function limparFormularioItem() {
    document.getElementById("itemDescricao").value = "";
    document.getElementById("itemPreco").value = "";
    document.getElementById("itemTamanho").value = "";
    document.getElementById("itemMarca").value = "";
    document.getElementById("itemObservacao").value = "";
    document.getElementById("itemConsignatario").selectedIndex = 0;
}

function renderizarItens() {
    const lista = document.getElementById("lista-itens");
    if (!lista) return;

    lista.innerHTML = "";

    const filtroStatus = document.getElementById("filtroStatusItem").value;
    const filtroCategoria = document.getElementById("filtroCategoria").value;
    const filtroConsignatario = document.getElementById("filtroConsignatarioItem").value.toLowerCase();

    let itensFiltrados = itens;

    if (filtroStatus) {
        itensFiltrados = itensFiltrados.filter(i => i.status === filtroStatus);
    }

    if (filtroCategoria) {
        itensFiltrados = itensFiltrados.filter(i => i.categoria === filtroCategoria);
    }

    if (filtroConsignatario) {
        itensFiltrados = itensFiltrados.filter(i => {
            const consignatario = consignatarios.find(c => c.id == i.consignatarioId);
            return consignatario && consignatario.nome.toLowerCase().includes(filtroConsignatario);
        });
    }

    itensFiltrados.forEach(i => {
        const consignatario = consignatarios.find(c => c.id == i.consignatarioId);
        const bazar = bazares.find(b => b.id == i.bazarId);

        const card = document.createElement("div");
        card.className = `item-card ${i.status}`;
        
        card.innerHTML = `
            <div class="item-info">
                <h3>${i.descricao}</h3>
                <p class="preco">${formatarMoeda(i.preco)}</p>
                <p class="cliente">Consignatário: ${consignatario ? consignatario.nome : "Não informado"}</p>
                <p class="bazar-info">${bazar ? bazar.nome : "Bazar não encontrado"} • ${i.categoria} • ${i.estado}</p>
                ${i.tamanho ? `<p class="bazar-info">Tamanho: ${i.tamanho}</p>` : ''}
                ${i.marca ? `<p class="bazar-info">Marca: ${i.marca}</p>` : ''}
                ${i.observacao ? `<p class="bazar-info">Obs: ${i.observacao}</p>` : ''}
            </div>
            <div class="status">
                <span class="status-badge ${i.status}">${i.status}</span>
            </div>
        `;

        lista.appendChild(card);
    });
}

function filtrarItens() {
    renderizarItens();
}

/* ============================================================
   7. VENDAS - CORRIGIDO PARA HTML
============================================================ */

function carregarDetalhesItem() {
    const itemId = document.getElementById("vendaItem").value;
    const detalhesDiv = document.getElementById("detalhesItemVenda");
    const infoDiv = document.getElementById("infoItemVenda");
    
    if (!itemId) {
        detalhesDiv.style.display = "none";
        return;
    }

    const item = itens.find(i => i.id == itemId);
    if (item) {
        const consignatario = consignatarios.find(c => c.id == item.consignatarioId);
        
        detalhesDiv.style.display = "block";
        infoDiv.innerHTML = `
            <p><strong>Descrição:</strong> ${item.descricao}</p>
            <p><strong>Categoria:</strong> ${item.categoria}</p>
            <p><strong>Tamanho:</strong> ${item.tamanho || 'Não informado'}</p>
            <p><strong>Marca:</strong> ${item.marca || 'Não informada'}</p>
            <p><strong>Estado:</strong> ${item.estado}</p>
            <p><strong>Consignatário:</strong> ${consignatario ? consignatario.nome : 'Não informado'}</p>
            <p><strong>Preço Original:</strong> ${formatarMoeda(item.preco)}</p>
        `;
        
        document.getElementById("vendaPreco").value = item.preco.toFixed(2);
        calcularResumoVenda();
    }
}

function calcularResumoVenda() {
    const preco = parseFloat(document.getElementById("vendaPreco").value);
    const resumoDiv = document.getElementById("resumoVenda");
    const detalhesResumo = document.getElementById("detalhesResumoVenda");
    
    if (isNaN(preco) || preco <= 0) {
        resumoDiv.style.display = "none";
        return;
    }

    const creditoConsignatario = preco * (configuracoes.percentualConsignatario / 100);
    const comissaoLoja = preco * (configuracoes.percentualLoja / 100);

    detalhesResumo.innerHTML = `
        <p><strong>Valor da Venda:</strong> ${formatarMoeda(preco)}</p>
        <p><strong>Crédito do Consignatário (${configuracoes.percentualConsignatario}%):</strong> ${formatarMoeda(creditoConsignatario)}</p>
        <p><strong>Comissão da Loja (${configuracoes.percentualLoja}%):</strong> ${formatarMoeda(comissaoLoja)}</p>
    `;
    
    resumoDiv.style.display = "block";
}

function registrarVenda() {
    const itemId = document.getElementById("vendaItem").value;
    const compradorId = document.getElementById("vendaComprador").value;
    const formaPagamento = document.getElementById("vendaFormaPagamento").value;
    const precoVenda = parseFloat(document.getElementById("vendaPreco").value);
    const dataVenda = document.getElementById("vendaData").value;
    const bazarId = document.getElementById("vendaBazar").value;

    if (!itemId || !compradorId || !formaPagamento || !bazarId || isNaN(precoVenda) || precoVenda <= 0) {
        mostrarNotificacao("Preencha todos os campos obrigatórios.", "erro");
        return;
    }

    const item = itens.find(i => i.id == itemId);
    if (!item) {
        mostrarNotificacao("Item inválido.", "erro");
        return;
    }

    if (item.status !== "disponivel") {
        mostrarNotificacao("Este item não está disponível para venda.", "erro");
        return;
    }

    const creditoConsignatario = precoVenda * (configuracoes.percentualConsignatario / 100);
    const comissaoLoja = precoVenda * (configuracoes.percentualLoja / 100);

    // Registrar venda
    vendas.push({
        id: gerarId(),
        itemId: parseInt(itemId),
        precoVenda,
        dataVenda: dataVenda,
        compradorId: parseInt(compradorId),
        bazarId: parseInt(bazarId),
        pagamento: formaPagamento,
        creditoConsignatario,
        comissaoLoja,
        consignatarioId: item.consignatarioId
    });

    // Atualizar saldo do consignatário
    const consignatario = consignatarios.find(c => c.id == item.consignatarioId);
    if (consignatario) {
        consignatario.credito = (consignatario.credito || 0) + creditoConsignatario;
    }

    // Marcar item como vendido
    item.status = "vendido";

    salvarDados();
    renderizarItens();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarDashboard();
    renderizarOpcoesSelects();

    limparFormularioVenda();
    mostrarNotificacao("Venda registrada com sucesso!", "sucesso");
}

function limparFormularioVenda() {
    document.getElementById("vendaItem").selectedIndex = 0;
    document.getElementById("vendaComprador").selectedIndex = 0;
    document.getElementById("vendaFormaPagamento").selectedIndex = 0;
    document.getElementById("vendaPreco").value = "";
    document.getElementById("vendaData").value = new Date().toISOString().split('T')[0];
    document.getElementById("vendaBazar").selectedIndex = 0;
    document.getElementById("detalhesItemVenda").style.display = "none";
    document.getElementById("resumoVenda").style.display = "none";
}

function renderizarVendas() {
    const tbody = document.getElementById("listaVendas");
    if (!tbody) return;

    tbody.innerHTML = "";

    vendas.forEach(v => {
        const item = itens.find(i => i.id == v.itemId);
        const comprador = compradores.find(c => c.id == v.compradorId);
        const consignatario = consignatarios.find(c => c.id == v.consignatarioId);
        const bazar = bazares.find(b => b.id == v.bazarId);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${formatarData(v.dataVenda)}</td>
            <td>${item ? item.descricao : "Item removido"}</td>
            <td>${bazar ? bazar.nome : "Bazar não encontrado"}</td>
            <td>${consignatario ? consignatario.nome : "Não informado"}</td>
            <td>${comprador ? comprador.nome : "Não informado"}</td>
            <td>${formatarMoeda(v.precoVenda)}</td>
            <td>${formatarMoeda(v.creditoConsignatario)}</td>
            <td>${formatarMoeda(v.comissaoLoja)}</td>
            <td>${v.pagamento}</td>
            <td class="table-actions">
                <button onclick="estornarVenda(${v.id})" title="Estornar" class="delete">
                    <i class="fas fa-undo"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function estornarVenda(vendaId) {
    if (!confirm("Tem certeza que deseja estornar esta venda?")) return;
    
    const vendaIndex = vendas.findIndex(v => v.id == vendaId);
    if (vendaIndex === -1) return;
    
    const venda = vendas[vendaIndex];
    const item = itens.find(i => i.id == venda.itemId);
    
    if (item) {
        item.status = "disponivel";
    }
    
    // Reverter crédito do consignatário
    const consignatario = consignatarios.find(c => c.id == venda.consignatarioId);
    if (consignatario) {
        consignatario.credito = Math.max(0, (consignatario.credito || 0) - venda.creditoConsignatario);
    }
    
    vendas.splice(vendaIndex, 1);
    
    salvarDados();
    renderizarItens();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarDashboard();
    renderizarOpcoesSelects();
    
    mostrarNotificacao("Venda estornada com sucesso!", "sucesso");
}

/* ============================================================
   8. CONSIGNATÁRIOS - CORRIGIDO PARA HTML
============================================================ */

function adicionarConsignatario() {
    const nome = document.getElementById("consignatarioNome").value.trim();
    const telefone = document.getElementById("consignatarioTelefone").value.trim();
    const cpf = document.getElementById("consignatarioCpf").value.trim();
    const email = document.getElementById("consignatarioEmail").value.trim();
    const observacao = document.getElementById("consignatarioObservacao").value.trim();

    if (!nome || !telefone) {
        mostrarNotificacao("Preencha nome e telefone!", "erro");
        return;
    }

    consignatarios.push({
        id: gerarId(),
        nome,
        telefone,
        cpf,
        email,
        observacao,
        credito: 0,
        status: "ativo"
    });

    salvarDados();
    renderizarConsignatarios();
    renderizarOpcoesSelects();

    limparFormularioConsignatario();
    mostrarNotificacao("Consignatário adicionado com sucesso!", "sucesso");
}

function limparFormularioConsignatario() {
    document.getElementById("consignatarioNome").value = "";
    document.getElementById("consignatarioTelefone").value = "";
    document.getElementById("consignatarioCpf").value = "";
    document.getElementById("consignatarioEmail").value = "";
    document.getElementById("consignatarioObservacao").value = "";
}

function renderizarConsignatarios() {
    const tbody = document.getElementById("listaConsignatarios");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtroStatus = document.getElementById("filtroStatusConsignatario").value;
    const filtroNome = document.getElementById("filtroNomeConsignatario").value.toLowerCase();

    let consignatariosFiltrados = consignatarios;

    if (filtroStatus) {
        consignatariosFiltrados = consignatariosFiltrados.filter(c => c.status === filtroStatus);
    }

    if (filtroNome) {
        consignatariosFiltrados = consignatariosFiltrados.filter(c => 
            c.nome.toLowerCase().includes(filtroNome)
        );
    }

    consignatariosFiltrados.forEach(c => {
        const itensConsignatario = itens.filter(i => i.consignatarioId == c.id);
        const itensVendidos = itensConsignatario.filter(i => i.status === "vendido");
        const creditosGerados = itensVendidos.reduce((acc, item) => {
            const venda = vendas.find(v => v.itemId == item.id);
            return acc + (venda ? venda.creditoConsignatario : 0);
        }, 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${c.nome}</td>
            <td>${c.telefone}</td>
            <td>${itensVendidos.length}</td>
            <td>${formatarMoeda(creditosGerados)}</td>
            <td>${formatarMoeda(c.credito || 0)}</td>
            <td><span class="status-badge ${c.status}">${c.status}</span></td>
            <td class="table-actions">
                <button onclick="editarConsignatario(${c.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="alternarStatusConsignatario(${c.id})" title="${c.status === 'ativo' ? 'Inativar' : 'Ativar'}">
                    <i class="fas fa-${c.status === 'ativo' ? 'pause' : 'play'}"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function filtrarConsignatarios() {
    renderizarConsignatarios();
}

function alternarStatusConsignatario(id) {
    const consignatario = consignatarios.find(c => c.id == id);
    if (consignatario) {
        consignatario.status = consignatario.status === 'ativo' ? 'inativo' : 'ativo';
        salvarDados();
        renderizarConsignatarios();
        mostrarNotificacao(`Consignatário ${consignatario.status === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, "sucesso");
    }
}

/* ============================================================
   9. COMPRADORES - CORRIGIDO PARA HTML
============================================================ */

function adicionarComprador() {
    const nome = document.getElementById("compradorNome").value.trim();
    const telefone = document.getElementById("compradorTelefone").value.trim();
    const email = document.getElementById("compradorEmail").value.trim();
    const obs = document.getElementById("compradorObservacao").value.trim();

    if (!nome || !telefone) {
        mostrarNotificacao("Preencha nome e telefone!", "erro");
        return;
    }

    compradores.push({
        id: gerarId(),
        nome,
        telefone,
        email,
        obs,
        status: "ativo"
    });

    salvarDados();
    renderizarCompradores();
    renderizarOpcoesSelects();

    limparFormularioComprador();
    mostrarNotificacao("Comprador adicionado com sucesso!", "sucesso");
}

function limparFormularioComprador() {
    document.getElementById("compradorNome").value = "";
    document.getElementById("compradorTelefone").value = "";
    document.getElementById("compradorEmail").value = "";
    document.getElementById("compradorObservacao").value = "";
}

function renderizarCompradores() {
    const tbody = document.getElementById("listaCompradores");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtroNome = document.getElementById("filtroNomeComprador").value.toLowerCase();

    let compradoresFiltrados = compradores;

    if (filtroNome) {
        compradoresFiltrados = compradoresFiltrados.filter(c => 
            c.nome.toLowerCase().includes(filtroNome)
        );
    }

    compradoresFiltrados.forEach(c => {
        const compras = vendas.filter(v => v.compradorId == c.id);
        const totalCompras = compras.reduce((acc, v) => acc + v.precoVenda, 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${c.nome}</td>
            <td>${c.telefone}</td>
            <td>${compras.length} (${formatarMoeda(totalCompras)})</td>
            <td><span class="status-badge ${c.status}">${c.status}</span></td>
            <td class="table-actions">
                <button onclick="editarComprador(${c.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="alternarStatusComprador(${c.id})" title="${c.status === 'ativo' ? 'Inativar' : 'Ativar'}">
                    <i class="fas fa-${c.status === 'ativo' ? 'pause' : 'play'}"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function filtrarCompradores() {
    renderizarCompradores();
}

function alternarStatusComprador(id) {
    const comprador = compradores.find(c => c.id == id);
    if (comprador) {
        comprador.status = comprador.status === 'ativo' ? 'inativo' : 'ativo';
        salvarDados();
        renderizarCompradores();
        mostrarNotificacao(`Comprador ${comprador.status === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`, "sucesso");
    }
}

/* ============================================================
   10. CONSUMO DE CRÉDITOS - NOVA FUNCIONALIDADE
============================================================ */

function atualizarSaldoConsumo() {
    const consignatarioId = document.getElementById("consumoConsignatario").value;
    const saldoDiv = document.getElementById("saldoAtualConsumo");
    const btnRegistrar = document.getElementById("btnRegistrarConsumo");
    
    if (!consignatarioId) {
        saldoDiv.innerHTML = "Selecione um consignatário para ver o saldo.";
        saldoDiv.style.backgroundColor = "var(--info)";
        btnRegistrar.disabled = true;
        return;
    }

    const consignatario = consignatarios.find(c => c.id == consignatarioId);
    if (consignatario) {
        const saldo = consignatario.credito || 0;
        saldoDiv.innerHTML = `
            <strong>Saldo Atual:</strong> ${formatarMoeda(saldo)}<br>
            <small>Consignatário: ${consignatario.nome}</small>
        `;
        
        if (saldo > 0) {
            saldoDiv.style.backgroundColor = "var(--success)";
            btnRegistrar.disabled = false;
        } else {
            saldoDiv.style.backgroundColor = "var(--danger)";
            btnRegistrar.disabled = true;
        }
    }
}

function validarConsumo() {
    const valor = parseFloat(document.getElementById("consumoValor").value);
    const consignatarioId = document.getElementById("consumoConsignatario").value;
    const btnRegistrar = document.getElementById("btnRegistrarConsumo");
    
    if (!consignatarioId || isNaN(valor) || valor <= 0) {
        btnRegistrar.disabled = true;
        return;
    }

    const consignatario = consignatarios.find(c => c.id == consignatarioId);
    if (consignatario && valor <= (consignatario.credito || 0)) {
        btnRegistrar.disabled = false;
    } else {
        btnRegistrar.disabled = true;
    }
}

function registrarConsumo() {
    const consignatarioId = document.getElementById("consumoConsignatario").value;
    const valor = parseFloat(document.getElementById("consumoValor").value);
    const data = document.getElementById("consumoData").value;
    const observacao = document.getElementById("consumoObservacao").value.trim();

    if (!consignatarioId || isNaN(valor) || valor <= 0 || !data) {
        mostrarNotificacao("Preencha todos os campos obrigatórios.", "erro");
        return;
    }

    const consignatario = consignatarios.find(c => c.id == consignatarioId);
    if (!consignatario) {
        mostrarNotificacao("Consignatário não encontrado.", "erro");
        return;
    }

    if (valor > (consignatario.credito || 0)) {
        mostrarNotificacao("Saldo insuficiente para este consumo.", "erro");
        return;
    }

    // Registrar consumo
    consumosCreditos.push({
        id: gerarId(),
        consignatarioId: parseInt(consignatarioId),
        valor,
        data,
        observacao,
        saldoAnterior: consignatario.credito || 0
    });

    // Atualizar saldo do consignatário
    consignatario.credito = (consignatario.credito || 0) - valor;

    salvarDados();
    renderizarConsumosCreditos();
    renderizarConsignatarios();
    atualizarSaldoConsumo();
    validarConsumo();

    limparFormularioConsumo();
    mostrarNotificacao("Consumo de crédito registrado com sucesso!", "sucesso");
}

function limparFormularioConsumo() {
    document.getElementById("consumoConsignatario").selectedIndex = 0;
    document.getElementById("consumoValor").value = "";
    document.getElementById("consumoData").value = new Date().toISOString().split('T')[0];
    document.getElementById("consumoObservacao").value = "";
    document.getElementById("saldoAtualConsumo").innerHTML = "Selecione um consignatário para ver o saldo.";
    document.getElementById("saldoAtualConsumo").style.backgroundColor = "var(--info)";
    document.getElementById("btnRegistrarConsumo").disabled = true;
}

function renderizarConsumosCreditos() {
    const tbody = document.getElementById("listaConsumos");
    if (!tbody) return;

    tbody.innerHTML = "";

    consumosCreditos.forEach(consumo => {
        const consignatario = consignatarios.find(c => c.id == consumo.consignatarioId);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatarData(consumo.data)}</td>
            <td>${consignatario ? consignatario.nome : "Consignatário não encontrado"}</td>
            <td>${formatarMoeda(consumo.valor)}</td>
            <td>${consumo.observacao || '-'}</td>
            <td class="table-actions">
                <button onclick="estornarConsumo(${consumo.id})" title="Estornar" class="delete">
                    <i class="fas fa-undo"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function estornarConsumo(consumoId) {
    if (!confirm("Tem certeza que deseja estornar este consumo?")) return;
    
    const consumoIndex = consumosCreditos.findIndex(c => c.id == consumoId);
    if (consumoIndex === -1) return;
    
    const consumo = consumosCreditos[consumoIndex];
    const consignatario = consignatarios.find(c => c.id == consumo.consignatarioId);
    
    if (consignatario) {
        consignatario.credito = (consignatario.credito || 0) + consumo.valor;
    }
    
    consumosCreditos.splice(consumoIndex, 1);
    
    salvarDados();
    renderizarConsumosCreditos();
    renderizarConsignatarios();
    atualizarSaldoConsumo();
    
    mostrarNotificacao("Consumo estornado com sucesso!", "sucesso");
}

/* ============================================================
   11. SELECTS GERAIS - CORRIGIDO PARA HTML
============================================================ */

function renderizarOpcoesSelects() {
    // Consignatários para itens
    const sConsig = document.getElementById("itemConsignatario");
    if (sConsig) {
        sConsig.innerHTML = '<option value="">Selecione um Consignatário</option>';
        consignatarios.filter(c => c.status === 'ativo').forEach(c => {
            sConsig.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
        });
    }

    // Itens disponíveis para venda
    const sItem = document.getElementById("vendaItem");
    if (sItem) {
        sItem.innerHTML = '<option value="">Selecione um item</option>';
        itens.filter(i => i.status === "disponivel").forEach(i => {
            const consignatario = consignatarios.find(c => c.id == i.consignatarioId);
            sItem.innerHTML += `<option value="${i.id}">${i.descricao} - ${formatarMoeda(i.preco)} (${consignatario ? consignatario.nome : 'N/I'})</option>`;
        });
    }

    // Compradores para venda
    const sComprador = document.getElementById("vendaComprador");
    if (sComprador) {
        sComprador.innerHTML = '<option value="">Selecione um Comprador</option>';
        compradores.filter(c => c.status === 'ativo').forEach(c => {
            sComprador.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
        });
    }

    // Bazares para venda
    const sBazar = document.getElementById("vendaBazar");
    if (sBazar) {
        sBazar.innerHTML = '<option value="">Selecione o Bazar</option>';
        bazares.forEach(b => {
            sBazar.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
        });
    }

    // Consignatários para consumo de créditos
    const sConsigConsumo = document.getElementById("consumoConsignatario");
    if (sConsigConsumo) {
        sConsigConsumo.innerHTML = '<option value="">Selecione um Consignatário</option>';
        consignatarios.filter(c => c.status === 'ativo' && (c.credito || 0) > 0).forEach(c => {
            sConsigConsumo.innerHTML += `<option value="${c.id}">${c.nome} (Saldo: ${formatarMoeda(c.credito || 0)})</option>`;
        });
    }
}

/* ============================================================
   12. DASHBOARD - CORRIGIDO PARA HTML
============================================================ */

function renderizarDashboard() {
    // Métricas básicas
    const totalItens = itens.length;
    const itensDisponiveis = itens.filter(i => i.status === "disponivel").length;
    const itensVendidos = itens.filter(i => i.status === "vendido").length;
    const totalVendas = vendas.length;
    const totalArrecadado = vendas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
    const totalCreditos = vendas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    const creditosAtivos = consignatarios.reduce((acc, c) => acc + (c.credito || 0), 0);

    // Atualizar cards
    document.getElementById("totalVendas").textContent = formatarMoeda(totalArrecadado);
    document.getElementById("totalCreditos").textContent = formatarMoeda(totalCreditos);
    document.getElementById("creditosAtivos").textContent = formatarMoeda(creditosAtivos);
    document.getElementById("totalComissao").textContent = formatarMoeda(totalComissao);
    document.getElementById("totalItensVendidos").textContent = itensVendidos;
    document.getElementById("totalItensEstoque").textContent = itensDisponiveis;

    // Progresso de vendas
    const progressVendas = document.getElementById("progressVendas");
    const metaVendas = 10000; // Meta exemplo de R$ 10.000
    const percentualVendas = Math.min((totalArrecadado / metaVendas) * 100, 100);
    progressVendas.style.width = `${percentualVendas}%`;

    // Top consignatários
    renderizarTopConsignatarios();

    // Lembretes
    renderizarLembretes();
}

function renderizarTopConsignatarios() {
    const tbody = document.getElementById("topClientes");
    if (!tbody) return;

    tbody.innerHTML = "";

    const consignatariosComVendas = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId == c.id);
        const totalVendido = vendasCons.reduce((acc, v) => acc + v.precoVenda, 0);
        const creditosGerados = vendasCons.reduce((acc, v) => acc + v.creditoConsignatario, 0);
        
        return {
            ...c,
            vendas: vendasCons.length,
            totalVendido,
            creditosGerados
        };
    }).filter(c => c.vendas > 0)
      .sort((a, b) => b.creditosGerados - a.creditosGerados)
      .slice(0, 5);

    consignatariosComVendas.forEach((c, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}º</td>
            <td>${c.nome}</td>
            <td>${formatarMoeda(c.creditosGerados)}</td>
            <td>${c.vendas}</td>
            <td>${formatarMoeda(c.credito || 0)}</td>
        `;
        tbody.appendChild(tr);
    });

    if (consignatariosComVendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma venda registrada ainda</td></tr>';
    }
}

function renderizarLembretes() {
    const lista = document.getElementById("lista-lembretes");
    if (!lista) return;

    lista.innerHTML = "";

    // Lembrete de estoque baixo
    const itensDisponiveis = itens.filter(i => i.status === "disponivel").length;
    if (itensDisponiveis < configuracoes.alertaEstoque) {
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Estoque Baixo!</strong>
                <p>Apenas ${itensDisponiveis} itens disponíveis no estoque.</p>
            </div>
            <div class="acoes">
                <button onclick="abrirAba('itens')" class="btn btn-primary btn-sm">
                    <i class="fas fa-plus"></i> Adicionar Itens
                </button>
            </div>
        `;
        lista.appendChild(lembrete);
    }

    // Lembrete de bazar não selecionado
    if (!bazarAtual) {
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Nenhum Bazar Selecionado</strong>
                <p>Selecione um bazar para começar a gerenciar itens e vendas.</p>
            </div>
            <div class="acoes">
                <button onclick="abrirAba('bazares')" class="btn btn-primary btn-sm">
                    <i class="fas fa-calendar-alt"></i> Gerenciar Bazares
                </button>
            </div>
        `;
        lista.appendChild(lembrete);
    }

    // Lembrete de créditos disponíveis
    const consignatariosComCredito = consignatarios.filter(c => (c.credito || 0) > 0);
    if (consignatariosComCredito.length > 0) {
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Créditos Disponíveis</strong>
                <p>${consignatariosComCredito.length} consignatário(s) com créditos para uso.</p>
            </div>
            <div class="acoes">
                <button onclick="abrirAba('consumoCreditos')" class="btn btn-info btn-sm">
                    <i class="fas fa-credit-card"></i> Usar Créditos
                </button>
            </div>
        `;
        lista.appendChild(lembrete);
    }

    if (lista.children.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Nenhum lembrete no momento</p>';
    }
}

/* ============================================================
   13. CONFIGURAÇÕES - CORRIGIDO PARA HTML
============================================================ */

function salvarConfiguracoes() {
    const pctCons = parseFloat(document.getElementById("percentualConsignatario").value);
    const pctLoja = parseFloat(document.getElementById("percentualLoja").value);
    const validade = parseInt(document.getElementById("validadeCredito").value);
    const alerta = parseInt(document.getElementById("alertaEstoque").value);

    if (pctCons + pctLoja !== 100) {
        mostrarNotificacao("A soma dos percentuais deve ser 100%!", "erro");
        return;
    }

    configuracoes.percentualConsignatario = pctCons;
    configuracoes.percentualLoja = pctLoja;
    configuracoes.validadeCredito = validade;
    configuracoes.alertaEstoque = alerta;

    salvarDados();
    mostrarNotificacao("Configurações salvas com sucesso!", "sucesso");
}

function carregarConfiguracoes() {
    document.getElementById("percentualConsignatario").value = configuracoes.percentualConsignatario;
    document.getElementById("percentualLoja").value = configuracoes.percentualLoja;
    document.getElementById("validadeCredito").value = configuracoes.validadeCredito;
    document.getElementById("alertaEstoque").value = configuracoes.alertaEstoque;
}

/* ============================================================
   14. EXPORTAR / IMPORTAR DADOS - CORRIGIDO
============================================================ */

function exportarDados() {
    const dados = {
        itens,
        vendas,
        bazares,
        consignatarios,
        compradores,
        consumosCreditos,
        configuracoes,
        bazarAtual,
        dataExportacao: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `bazarplus_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    mostrarNotificacao("Dados exportados com sucesso!", "sucesso");
}

function iniciarImportacao() {
    document.getElementById("importFile").click();
}

function processarImportacao(event) {
    const file = event.target.files[0];
    if (!file) {
        mostrarNotificacao("Selecione um arquivo válido!", "erro");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);

            if (confirm("Isso substituirá todos os dados atuais. Continuar?")) {
                itens = dados.itens || [];
                vendas = dados.vendas || [];
                bazares = dados.bazares || [];
                consignatarios = dados.consignatarios || [];
                compradores = dados.compradores || [];
                consumosCreditos = dados.consumosCreditos || [];
                configuracoes = dados.configuracoes || configuracoes;
                bazarAtual = dados.bazarAtual || null;

                salvarDados();
                init();
                mostrarNotificacao("Dados importados com sucesso!", "sucesso");
            }

        } catch (erro) {
            mostrarNotificacao("Arquivo inválido ou corrompido!", "erro");
        }
    };

    reader.readAsText(file);
    event.target.value = ""; // Resetar input
}

/* ============================================================
   RELATÓRIOS PDF - MELHORADOS E COMPLETOS
============================================================ */

function gerarRelatorioVendasPorBazarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    const paginaTotal = { atual: 1, total: 1 };
    
    // Função para adicionar cabeçalho
    function adicionarCabecalho() {
        doc.setFillColor(139, 92, 246); // Cor roxa
        doc.rect(0, 0, 297, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("RELATÓRIO DETALHADO DE VENDAS POR BAZAR", 148, 12, { align: "center" });
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Sistema BazarPlus - Gerado em: ${dataHoraGeracao}`, 20, 28);
        
        // Informações do relatório
        doc.text(`Total de Bazares: ${bazares.length}`, 200, 28);
        doc.text(`Total de Vendas: ${vendas.length}`, 250, 28);
    }
    
    // Função para adicionar rodapé
    function adicionarRodape() {
        const paginaAtual = paginaTotal.atual;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${paginaAtual} de ${paginaTotal.total}`, 148, 205, { align: "center" });
        doc.text("Sistema BazarPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    // Calcular totais gerais
    const totalGeralVendas = vendas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalGeralComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
    const totalGeralCreditos = vendas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    
    adicionarCabecalho();
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    doc.text(`Total em Vendas: ${formatarMoeda(totalGeralVendas)}`, 20, 48);
    doc.text(`Comissão da Loja: ${formatarMoeda(totalGeralComissao)}`, 20, 54);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalGeralCreditos)}`, 20, 60);
    doc.text(`Bazares Ativos: ${bazares.filter(b => b.status === 'ativo').length}`, 100, 48);
    doc.text(`Consignatários: ${consignatarios.filter(c => c.status === 'ativo').length}`, 100, 54);
    doc.text(`Itens Vendidos: ${itens.filter(i => i.status === 'vendido').length}`, 100, 60);
    
    let y = 70;
    
    // Agrupar vendas por bazar
    const vendasPorBazar = {};
    bazares.forEach(bazar => {
        const vendasBazar = vendas.filter(v => v.bazarId === bazar.id);
        if (vendasBazar.length > 0) {
            vendasPorBazar[bazar.nome] = {
                vendas: vendasBazar,
                total: vendasBazar.reduce((acc, v) => acc + v.precoVenda, 0),
                comissao: vendasBazar.reduce((acc, v) => acc + v.comissaoLoja, 0),
                creditos: vendasBazar.reduce((acc, v) => acc + v.creditoConsignatario, 0)
            };
        }
    });
    
    // Ordenar bazares por total de vendas (decrescente)
    const bazaresOrdenados = Object.keys(vendasPorBazar).sort((a, b) => 
        vendasPorBazar[b].total - vendasPorBazar[a].total
    );
    
    bazaresOrdenados.forEach((nomeBazar, index) => {
        const dadosBazar = vendasPorBazar[nomeBazar];
        const bazar = bazares.find(b => b.nome === nomeBazar);
        
        // Verificar se precisa de nova página
        if (y > 160) {
            adicionarRodape();
            doc.addPage("landscape");
            paginaTotal.atual++;
            paginaTotal.total++;
            y = 20;
            adicionarCabecalho();
        }
        
        // Cabeçalho do bazar
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 257, 12, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${nomeBazar}`, 22, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Data: ${formatarData(bazar.inicio)}`, 180, y + 8);
        doc.text(`Total: ${formatarMoeda(dadosBazar.total)}`, 220, y + 8);
        doc.text(`Vendas: ${dadosBazar.vendas.length}`, 260, y + 8);
        
        y += 15;
        
        // Tabela de vendas do bazar
        const linhasVendas = dadosBazar.vendas.map(v => {
            const item = itens.find(i => i.id === v.itemId);
            const comprador = compradores.find(c => c.id === v.compradorId);
            const consignatario = consignatarios.find(c => c.id === v.consignatarioId);
            
            return [
                formatarData(v.dataVenda),
                item ? item.descricao.substring(0, 30) + (item.descricao.length > 30 ? '...' : '') : "-",
                comprador ? comprador.nome.substring(0, 20) : "-",
                consignatario ? consignatario.nome.substring(0, 20) : "-",
                v.pagamento,
                formatarMoeda(v.precoVenda),
                formatarMoeda(v.creditoConsignatario),
                formatarMoeda(v.comissaoLoja)
            ];
        });
        
        doc.autoTable({
            head: [["Data", "Item", "Comprador", "Consignatário", "Pagamento", "Valor", "Crédito", "Comissão"]],
            body: linhasVendas,
            startY: y,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });
        
        y = doc.lastAutoTable.finalY + 10;
        
        // Resumo do bazar
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMO DO BAZAR:", 22, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Vendido: ${formatarMoeda(dadosBazar.total)}`, 80, y);
        doc.text(`Comissão Loja: ${formatarMoeda(dadosBazar.comissao)}`, 130, y);
        doc.text(`Créditos Gerados: ${formatarMoeda(dadosBazar.creditos)}`, 180, y);
        doc.text(`Ticket Médio: ${formatarMoeda(dadosBazar.total / dadosBazar.vendas.length)}`, 230, y);
        
        y += 15;
    });
    
    // Página de totais gerais se houver espaço
    if (y < 180) {
        doc.setFillColor(220, 220, 220);
        doc.rect(20, y, 257, 15, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAIS GERAIS DO SISTEMA", 22, y + 10);
        
        y += 20;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Geral em Vendas: ${formatarMoeda(totalGeralVendas)}`, 22, y);
        doc.text(`Comissão Total da Loja: ${formatarMoeda(totalGeralComissao)}`, 22, y + 8);
        doc.text(`Créditos Totais Gerados: ${formatarMoeda(totalGeralCreditos)}`, 22, y + 16);
        
        doc.text(`Bazares Cadastrados: ${bazares.length}`, 150, y);
        doc.text(`Itens no Sistema: ${itens.length}`, 150, y + 8);
        doc.text(`Consignatários Ativos: ${consignatarios.filter(c => c.status === 'ativo').length}`, 150, y + 16);
    }
    
    adicionarRodape();
    doc.save("relatorio_vendas_bazar_detalhado.pdf");
}

function gerarRelatorioVendasPorConsignatarioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    
    // Cabeçalho
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 297, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE VENDAS POR CONSIGNATÁRIO", 148, 12, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema BazarPlus - Gerado em: ${dataHoraGeracao}`, 20, 28);
    
    // Preparar dados dos consignatários
    const dadosConsignatarios = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
        const itensCons = itens.filter(i => i.consignatarioId === c.id);
        const itensVendidos = itensCons.filter(i => i.status === "vendido");
        const totalVendido = vendasCons.reduce((acc, v) => acc + v.precoVenda, 0);
        const totalCreditos = vendasCons.reduce((acc, v) => acc + v.creditoConsignatario, 0);
        const totalComissao = vendasCons.reduce((acc, v) => acc + v.comissaoLoja, 0);
        
        return {
            ...c,
            vendas: vendasCons.length,
            itensCadastrados: itensCons.length,
            itensVendidos: itensVendidos.length,
            totalVendido,
            totalCreditos,
            totalComissao,
            saldoAtual: c.credito || 0,
            taxaConversao: itensCons.length > 0 ? (itensVendidos.length / itensCons.length * 100).toFixed(1) + '%' : '0%'
        };
    }).filter(c => c.vendas > 0)
      .sort((a, b) => b.totalVendido - a.totalVendido);
    
    // Totais gerais
    const totalGeralVendas = dadosConsignatarios.reduce((acc, c) => acc + c.totalVendido, 0);
    const totalGeralCreditos = dadosConsignatarios.reduce((acc, c) => acc + c.totalCreditos, 0);
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    doc.text(`Total em Vendas: ${formatarMoeda(totalGeralVendas)}`, 20, 48);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalGeralCreditos)}`, 20, 54);
    doc.text(`Consignatários com Vendas: ${dadosConsignatarios.length}`, 20, 60);
    doc.text(`Ticket Médio: ${formatarMoeda(totalGeralVendas / vendas.length)}`, 120, 48);
    doc.text(`Melhor Consignatário: ${dadosConsignatarios[0] ? dadosConsignatarios[0].nome : 'N/A'}`, 120, 54);
    doc.text(`Maior Venda: ${formatarMoeda(Math.max(...vendas.map(v => v.precoVenda)))}`, 120, 60);
    
    // Tabela principal
    const linhas = dadosConsignatarios.map((c, index) => [
        (index + 1).toString(),
        c.nome,
        c.vendas.toString(),
        c.itensCadastrados.toString(),
        c.itensVendidos.toString(),
        c.taxaConversao,
        formatarMoeda(c.totalVendido),
        formatarMoeda(c.totalCreditos),
        formatarMoeda(c.saldoAtual),
        formatarMoeda(c.totalComissao)
    ]);
    
    doc.autoTable({
        head: [["#", "Consignatário", "Vendas", "Itens Cad.", "Itens Vend.", "Taxa Conv.", "Total Vendido", "Créditos Gerados", "Saldo Atual", "Comissão Loja"]],
        body: linhas,
        startY: 70,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: function(data) {
            // Rodapé em cada página
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Página ${data.pageNumber} de ${data.pageCount}`, 148, 205, { align: "center" });
            doc.text("Sistema BazarPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
        }
    });
    
    // Análise de performance
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 180) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("ANÁLISE DE PERFORMANCE", 20, finalY);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const top3 = dadosConsignatarios.slice(0, 3);
        top3.forEach((c, index) => {
            const yPos = finalY + 10 + (index * 6);
            doc.text(`${index + 1}º - ${c.nome}: ${formatarMoeda(c.totalVendido)} (${c.vendas} vendas)`, 22, yPos);
        });
        
        // Estatísticas
        const yStats = finalY + 30;
        doc.text(`Maior Venda Individual: ${formatarMoeda(Math.max(...vendas.map(v => v.precoVenda)))}`, 150, finalY + 10);
        doc.text(`Menor Venda Individual: ${formatarMoeda(Math.min(...vendas.map(v => v.precoVenda)))}`, 150, finalY + 16);
        doc.text(`Venda Média: ${formatarMoeda(totalGeralVendas / vendas.length)}`, 150, finalY + 22);
    }
    
    doc.save("relatorio_vendas_consignatarios.pdf");
}

function gerarRelatorioVendasPorMesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    const anoAtual = new Date().getFullYear();
    
    // Cabeçalho
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 297, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`RELATÓRIO DE VENDAS POR MÊS - ${anoAtual}`, 148, 12, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema BazarPlus - Gerado em: ${dataHoraGeracao}`, 20, 28);
    
    // Agrupar vendas por mês
    const vendasDoAno = vendas.filter(v => new Date(v.dataVenda).getFullYear() === anoAtual);
    const vendasPorMes = {};
    
    vendasDoAno.forEach(v => {
        const mes = new Date(v.dataVenda).getMonth();
        if (!vendasPorMes[mes]) {
            vendasPorMes[mes] = {
                vendas: [],
                total: 0,
                comissao: 0,
                creditos: 0
            };
        }
        vendasPorMes[mes].vendas.push(v);
        vendasPorMes[mes].total += v.precoVenda;
        vendasPorMes[mes].comissao += v.comissaoLoja;
        vendasPorMes[mes].creditos += v.creditoConsignatario;
    });
    
    // Preparar dados para tabela
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const linhas = [];
    let totalAno = 0;
    let totalComissaoAno = 0;
    let totalCreditosAno = 0;
    
    meses.forEach((mesNome, mesIndex) => {
        const dadosMes = vendasPorMes[mesIndex] || { vendas: [], total: 0, comissao: 0, creditos: 0 };
        linhas.push([
            mesNome,
            dadosMes.vendas.length.toString(),
            formatarMoeda(dadosMes.total),
            formatarMoeda(dadosMes.comissao),
            formatarMoeda(dadosMes.creditos),
            dadosMes.vendas.length > 0 ? formatarMoeda(dadosMes.total / dadosMes.vendas.length) : formatarMoeda(0)
        ]);
        
        totalAno += dadosMes.total;
        totalComissaoAno += dadosMes.comissao;
        totalCreditosAno += dadosMes.creditos;
    });
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO DO ANO", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    doc.text(`Total do Ano: ${formatarMoeda(totalAno)}`, 20, 48);
    doc.text(`Comissão do Ano: ${formatarMoeda(totalComissaoAno)}`, 20, 54);
    doc.text(`Créditos do Ano: ${formatarMoeda(totalCreditosAno)}`, 20, 60);
    doc.text(`Vendas no Ano: ${vendasDoAno.length}`, 120, 48);
    doc.text(`Mês com Mais Vendas: ${meses[Object.keys(vendasPorMes).reduce((a, b) => vendasPorMes[a].vendas.length > vendasPorMes[b].vendas.length ? a : b)] || 'N/A'}`, 120, 54);
    doc.text(`Ticket Médio Anual: ${formatarMoeda(totalAno / vendasDoAno.length)}`, 120, 60);
    
    // Tabela principal
    doc.autoTable({
        head: [["Mês", "Qtd Vendas", "Total Vendido", "Comissão Loja", "Créditos Gerados", "Ticket Médio"]],
        body: linhas,
        startY: 70,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: function(data) {
            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Página ${data.pageNumber} de ${data.pageCount}`, 148, 205, { align: "center" });
            doc.text("Sistema BazarPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
        }
    });
    
    // Gráfico de barras simples (textual)
    const finalY = doc.lastAutoTable.finalY + 15;
    if (finalY < 180) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("DISTRIBUIÇÃO DE VENDAS POR MÊS", 20, finalY);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        
        const maxVendas = Math.max(...Object.values(vendasPorMes).map(m => m.total));
        let yChart = finalY + 10;
        
        meses.forEach((mesNome, mesIndex) => {
            const dadosMes = vendasPorMes[mesIndex] || { total: 0 };
            const percentual = maxVendas > 0 ? (dadosMes.total / maxVendas) * 100 : 0;
            const barWidth = (percentual * 150) / 100;
            
            doc.setFillColor(139, 92, 246);
            doc.rect(50, yChart, barWidth, 5, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.text(mesNome.substring(0, 3), 30, yChart + 4);
            doc.text(formatarMoeda(dadosMes.total), 210, yChart + 4);
            
            yChart += 8;
        });
    }
    
    doc.save(`relatorio_vendas_mensal_${anoAtual}.pdf`);
}

function gerarRelatorioCreditosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    
    // Cabeçalho
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 297, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE SALDOS DE CRÉDITOS", 148, 12, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema BazarPlus - Gerado em: ${dataHoraGeracao}`, 20, 28);
    
    // Preparar dados
    const dadosConsignatarios = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
        const itensVendidos = itens.filter(i => i.consignatarioId === c.id && i.status === "vendido");
        const consumos = consumosCreditos.filter(cons => cons.consignatarioId === c.id);
        const totalConsumido = consumos.reduce((acc, cons) => acc + cons.valor, 0);
        
        return {
            ...c,
            vendas: vendasCons.length,
            itensVendidos: itensVendidos.length,
            totalCreditosGerados: vendasCons.reduce((acc, v) => acc + v.creditoConsignatario, 0),
            totalConsumido,
            saldoAtual: c.credito || 0,
            ultimoConsumo: consumos.length > 0 ? 
                new Date(Math.max(...consumos.map(c => new Date(c.data)))) : null
        };
    }).sort((a, b) => b.saldoAtual - a.saldoAtual);
    
    // Totais gerais
    const totalSaldos = dadosConsignatarios.reduce((acc, c) => acc + c.saldoAtual, 0);
    const totalCreditosGerados = dadosConsignatarios.reduce((acc, c) => acc + c.totalCreditosGerados, 0);
    const totalConsumido = dadosConsignatarios.reduce((acc, c) => acc + c.totalConsumido, 0);
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO DE CRÉDITOS", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    doc.text(`Saldo Total em Créditos: ${formatarMoeda(totalSaldos)}`, 20, 48);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalCreditosGerados)}`, 20, 54);
    doc.text(`Créditos Consumidos: ${formatarMoeda(totalConsumido)}`, 20, 60);
    doc.text(`Consignatários com Saldo: ${dadosConsignatarios.filter(c => c.saldoAtual > 0).length}`, 120, 48);
    doc.text(`Maior Saldo: ${formatarMoeda(Math.max(...dadosConsignatarios.map(c => c.saldoAtual)))}`, 120, 54);
    doc.text(`Taxa de Uso: ${totalCreditosGerados > 0 ? ((totalConsumido / totalCreditosGerados) * 100).toFixed(1) + '%' : '0%'}`, 120, 60);
    
    // Tabela principal
    const linhas = dadosConsignatarios.map((c, index) => [
        (index + 1).toString(),
        c.nome,
        c.vendas.toString(),
        c.itensVendidos.toString(),
        formatarMoeda(c.totalCreditosGerados),
        formatarMoeda(c.totalConsumido),
        formatarMoeda(c.saldoAtual),
        c.ultimoConsumo ? formatarData(c.ultimoConsumo) : "Nunca",
        c.status
    ]);
    
    doc.autoTable({
        head: [["#", "Consignatário", "Vendas", "Itens Vend.", "Créditos Gerados", "Créditos Usados", "Saldo Atual", "Último Uso", "Status"]],
        body: linhas,
        startY: 70,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        willDrawCell: function(data) {
            // Destacar saldos positivos
            if (data.column.index === 6 && data.cell.raw !== formatarMoeda(0)) {
                doc.setTextColor(0, 128, 0); // Verde para saldos positivos
            }
        },
        didDrawPage: function(data) {
            // Rodapé
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(`Página ${data.pageNumber} de ${data.pageCount}`, 148, 205, { align: "center" });
            doc.text("Sistema BazarPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
        }
    });
    
    // Análise de saldos
    const finalY = doc.lastAutoTable.finalY + 10;
    if (finalY < 180) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("ANÁLISE DE SALDOS", 20, finalY);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        
        const comSaldo = dadosConsignatarios.filter(c => c.saldoAtual > 0);
        const semSaldo = dadosConsignatarios.filter(c => c.saldoAtual === 0);
        
        doc.text(`Consignatários com saldo: ${comSaldo.length}`, 22, finalY + 10);
        doc.text(`Consignatários sem saldo: ${semSaldo.length}`, 22, finalY + 16);
        doc.text(`Percentual com saldo: ${((comSaldo.length / dadosConsignatarios.length) * 100).toFixed(1)}%`, 22, finalY + 22);
        
        // Top 3 saldos
        doc.text("Maiores Saldos:", 150, finalY + 10);
        comSaldo.slice(0, 3).forEach((c, index) => {
            doc.text(`${index + 1}º - ${c.nome}: ${formatarMoeda(c.saldoAtual)}`, 152, finalY + 18 + (index * 6));
        });
    }
    
    doc.save("relatorio_saldos_creditos.pdf");
}

// NOVO RELATÓRIO: Relatório Completo do Sistema
function gerarRelatorioCompletoSistemaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    
    // Cabeçalho
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 297, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO COMPLETO DO SISTEMA - BAZARPLUS", 148, 12, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema BazarPlus - Gerado em: ${dataHoraGeracao}`, 20, 28);
    
    // Resumo Geral do Sistema
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("VISÃO GERAL DO SISTEMA", 20, 40);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Coluna 1 - Estatísticas Básicas
    doc.text("ESTATÍSTICAS GERAIS:", 22, 50);
    doc.text(`Total de Bazares: ${bazares.length}`, 22, 58);
    doc.text(`Bazar Atual: ${bazarAtual ? bazares.find(b => b.id === bazarAtual)?.nome : 'Nenhum'}`, 22, 64);
    doc.text(`Total de Itens: ${itens.length}`, 22, 70);
    doc.text(`Itens Disponíveis: ${itens.filter(i => i.status === 'disponivel').length}`, 22, 76);
    doc.text(`Itens Vendidos: ${itens.filter(i => i.status === 'vendido').length}`, 22, 82);
    
    // Coluna 2 - Pessoas
    doc.text("CADASTROS:", 100, 50);
    doc.text(`Consignatários: ${consignatarios.length}`, 100, 58);
    doc.text(`Consignatários Ativos: ${consignatarios.filter(c => c.status === 'ativo').length}`, 100, 64);
    doc.text(`Compradores: ${compradores.length}`, 100, 70);
    doc.text(`Compradores Ativos: ${compradores.filter(c => c.status === 'ativo').length}`, 100, 76);
    
    // Coluna 3 - Financeiro
    const totalVendas = vendas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
    const totalCreditos = vendas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    const totalSaldos = consignatarios.reduce((acc, c) => acc + (c.credito || 0), 0);
    
    doc.text("FINANCEIRO:", 180, 50);
    doc.text(`Total em Vendas: ${formatarMoeda(totalVendas)}`, 180, 58);
    doc.text(`Comissão da Loja: ${formatarMoeda(totalComissao)}`, 180, 64);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalCreditos)}`, 180, 70);
    doc.text(`Saldos em Crédito: ${formatarMoeda(totalSaldos)}`, 180, 76);
    
    // Coluna 4 - Performance
    doc.text("PERFORMANCE:", 250, 50);
    doc.text(`Vendas Realizadas: ${vendas.length}`, 250, 58);
    doc.text(`Ticket Médio: ${formatarMoeda(vendas.length > 0 ? totalVendas / vendas.length : 0)}`, 250, 64);
    doc.text(`Taxa de Vendas: ${itens.length > 0 ? ((itens.filter(i => i.status === 'vendido').length / itens.length) * 100).toFixed(1) + '%' : '0%'}`, 250, 70);
    doc.text(`Consumos Registrados: ${consumosCreditos.length}`, 250, 76);
    
    // Tabela de Bazares
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("BAZARES CADASTRADOS", 20, 95);
    
    const linhasBazares = bazares.map(b => {
        const itensBazar = itens.filter(i => i.bazarId === b.id);
        const vendasBazar = vendas.filter(v => v.bazarId === b.id);
        const totalBazar = vendasBazar.reduce((acc, v) => acc + v.precoVenda, 0);
        
        return [
            b.nome,
            formatarData(b.inicio),
            b.tema || '-',
            itensBazar.length.toString(),
            vendasBazar.length.toString(),
            formatarMoeda(totalBazar),
            b.status
        ];
    });
    
    doc.autoTable({
        head: [["Bazar", "Data", "Tema", "Itens", "Vendas", "Total", "Status"]],
        body: linhasBazares,
        startY: 100,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 }
    });
    
    // Tabela de Top Consignatários
    const finalYBazares = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOP 5 CONSIGNATÁRIOS - MAIORES VENDEDORES", 20, finalYBazares);
    
    const topConsignatarios = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
        const total = vendasCons.reduce((acc, v) => acc + v.precoVenda, 0);
        return { ...c, vendas: vendasCons.length, total };
    }).filter(c => c.vendas > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    
    const linhasTop = topConsignatarios.map((c, index) => [
        (index + 1).toString(),
        c.nome,
        c.vendas.toString(),
        formatarMoeda(c.total),
        formatarMoeda(c.credito || 0)
    ]);
    
    doc.autoTable({
        head: [["Posição", "Consignatário", "Vendas", "Total Vendido", "Saldo Atual"]],
        body: linhasTop,
        startY: finalYBazares + 5,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [80, 80, 80], textColor: 255, fontSize: 8 }
    });
    
    // Rodapé
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Relatório Gerencial Completo - Sistema BazarPlus", 148, finalY, { align: "center" });
    doc.text(`Gerado em: ${dataHoraGeracao}`, 280, finalY, { align: "right" });
    
    doc.save("relatorio_completo_sistema.pdf");
}

/* ============================================================
   16. FUNÇÕES GERAIS DO SISTEMA
============================================================ */

function limparTudo() {
    if (!confirm("Tem certeza que deseja APAGAR TODOS os dados do sistema? Esta ação não pode ser desfeita!")) return;

    localStorage.removeItem("bazarplus_db");

    itens = [];
    vendas = [];
    bazares = [];
    consignatarios = [];
    compradores = [];
    consumosCreditos = [];
    bazarAtual = null;

    init();
    mostrarNotificacao("Todos os dados foram apagados com sucesso.", "sucesso");
}

/* ============================================================
   FUNÇÃO PARA NAVEGAR ENTRE ABAS - ADICIONADA
============================================================ */
/* ============================================================
   FUNÇÃO PARA NAVEGAR ENTRE ABAS - CORRIGIDA
============================================================ */

function abrirTab(aba) {
    console.log("Abrindo aba:", aba);
    
    // Esconder todas as abas
    const abas = document.querySelectorAll(".tab-content");
    abas.forEach(a => {
        a.classList.remove("active");
    });
    
    // Remover classe active de todos os botões
    const botoes = document.querySelectorAll(".tab-button");
    botoes.forEach(b => {
        b.classList.remove("active");
    });
    
    // Mostrar a aba selecionada
    const abaSelecionada = document.getElementById(aba);
    if (abaSelecionada) {
        abaSelecionada.classList.add("active");
        
        // Ativar o botão correspondente
        const botoesAba = document.querySelectorAll('.tab-button');
        botoesAba.forEach(botao => {
            if (botao.getAttribute('onclick') === `abrirTab('${aba}')`) {
                botao.classList.add("active");
            }
        });
        
        // Atualizar dados específicos da aba
        if (aba === 'dashboard') {
            renderizarDashboard();
        } else if (aba === 'itens') {
            renderizarItens();
        } else if (aba === 'vendas') {
            renderizarVendas();
            renderizarOpcoesSelects();
        } else if (aba === 'consignatarios') {
            renderizarConsignatarios();
        } else if (aba === 'compradores') {
            renderizarCompradores();
        } else if (aba === 'consumoCreditos') {
            renderizarConsumosCreditos();
            renderizarOpcoesSelects();
        } else if (aba === 'configuracoes') {
            carregarConfiguracoes();
        } else if (aba === 'bazares') {
            renderizarBazares();
        }
    } else {
        console.error("Aba não encontrada:", aba);
    }
}

// Função alias para compatibilidade
function abrirAba(aba) {
    abrirTab(aba);
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('bazarplus_theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    mostrarNotificacao(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, "sucesso");
}

function carregarTema() {
    const savedTheme = localStorage.getItem('bazarplus_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}
/* ============================================================
   FUNÇÕES PARA DADOS DE EXEMPLO
============================================================ */

function carregarExemplosConfirmacao() {
    if (!confirm("Isso substituirá todos os dados atuais por dados de exemplo. Deseja continuar?")) {
        return;
    }
    
    if (!confirm("ATENÇÃO: Todos os dados atuais serão perdidos! Tem certeza?")) {
        return;
    }
    
    carregarDadosExemplo();
}

function carregarDadosExemplo() {
    // Limpar dados existentes
    itens = [];
    vendas = [];
    bazares = [];
    consignatarios = [];
    compradores = [];
    consumosCreditos = [];
    bazarAtual = null;
    
    // Configurações padrão
    configuracoes = {
        percentualConsignatario: 80,
        percentualLoja: 20,
        alertaEstoque: 5,
        validadeCredito: 6
    };
    
    // Criar consignatários de exemplo com nomes fictícios
    const consignatariosExemplo = [
        { id: gerarId(), nome: "CONSIGNATÁRIO EXEMPLO 1", telefone: "(11) 11111-1111", email: "consignatario1@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "CONSIGNATÁRIO EXEMPLO 2", telefone: "(11) 22222-2222", email: "consignatario2@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "CONSIGNATÁRIO EXEMPLO 3", telefone: "(11) 33333-3333", email: "consignatario3@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "CONSIGNATÁRIO EXEMPLO 4", telefone: "(11) 44444-4444", email: "consignatario4@exemplo.com", credito: 0, status: "ativo" }
    ];
    
    consignatarios = consignatariosExemplo;
    
    // Criar compradores de exemplo com nomes fictícios
    const compradoresExemplo = [
        { id: gerarId(), nome: "COMPRADOR EXEMPLO 1", telefone: "(11) 55555-5555", email: "comprador1@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "COMPRADOR EXEMPLO 2", telefone: "(11) 66666-6666", email: "comprador2@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "COMPRADOR EXEMPLO 3", telefone: "(11) 77777-7777", email: "comprador3@exemplo.com", status: "ativo" }
    ];
    
    compradores = compradoresExemplo;
    
    // Criar bazares de exemplo
    const hoje = new Date();
    const bazar1Id = gerarId();
    const bazaresExemplo = [
        { 
            id: bazar1Id, 
            nome: "BAZAR EXEMPLO 1 - VERÃO", 
            inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0],
            tema: "Roupas de Verão",
            observacao: "Bazar de exemplo para testes",
            status: "ativo"
        },
        { 
            id: gerarId(), 
            nome: "BAZAR EXEMPLO 2 - INVERNO", 
            inicio: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 15).toISOString().split('T')[0],
            tema: "Roupas de Inverno", 
            observacao: "Segundo bazar de exemplo",
            status: "ativo"
        }
    ];
    
    bazares = bazaresExemplo;
    bazarAtual = bazar1Id;
    
    // Criar itens de exemplo com descrições claras
    const itensExemplo = [
        // Itens disponíveis - EXEMPLO 1
        { id: gerarId(), descricao: "ITEM EXEMPLO 1 - Vestido Floral", categoria: "roupa", preco: 89.90, tamanho: "M", marca: "Marca Exemplo", estado: "novo", consignatarioId: consignatarios[0].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        { id: gerarId(), descricao: "ITEM EXEMPLO 2 - Blusa Básica", categoria: "roupa", preco: 45.00, tamanho: "P", marca: "Marca Exemplo", estado: "seminovo", consignatarioId: consignatarios[0].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        
        // Itens disponíveis - EXEMPLO 2
        { id: gerarId(), descricao: "ITEM EXEMPLO 3 - Calça Jeans", categoria: "roupa", preco: 79.90, tamanho: "38", marca: "Marca Exemplo", estado: "usado", consignatarioId: consignatarios[1].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        { id: gerarId(), descricao: "ITEM EXEMPLO 4 - Camiseta Básica", categoria: "roupa", preco: 35.00, tamanho: "G", marca: "Marca Exemplo", estado: "novo", consignatarioId: consignatarios[1].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        
        // Itens disponíveis - EXEMPLO 3
        { id: gerarId(), descricao: "ITEM EXEMPLO 5 - Bolsa de Couro", categoria: "bolsa", preco: 120.00, tamanho: "Único", marca: "Marca Exemplo", estado: "seminovo", consignatarioId: consignatarios[2].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        
        // Itens disponíveis - EXEMPLO 4
        { id: gerarId(), descricao: "ITEM EXEMPLO 6 - Sandália Salto", categoria: "calcado", preco: 95.50, tamanho: "36", marca: "Marca Exemplo", estado: "novo", consignatarioId: consignatarios[3].id, bazarId: bazarAtual, status: "disponivel", dataCadastro: new Date().toISOString() },
        
        // Itens vendidos - para demonstrar funcionalidade
        { id: gerarId(), descricao: "ITEM VENDIDO EXEMPLO 1 - Blazer", categoria: "roupa", preco: 150.00, tamanho: "42", marca: "Marca Exemplo", estado: "novo", consignatarioId: consignatarios[1].id, bazarId: bazarAtual, status: "vendido", dataCadastro: new Date().toISOString() },
        { id: gerarId(), descricao: "ITEM VENDIDO EXEMPLO 2 - Saia", categoria: "roupa", preco: 55.00, tamanho: "40", marca: "Marca Exemplo", estado: "seminovo", consignatarioId: consignatarios[2].id, bazarId: bazarAtual, status: "vendido", dataCadastro: new Date().toISOString() }
    ];
    
    itens = itensExemplo;
    
    // Criar vendas de exemplo
    const vendasExemplo = [
        {
            id: gerarId(),
            itemId: itens[6].id, // ITEM VENDIDO EXEMPLO 1
            precoVenda: 150.00,
            dataVenda: new Date(hoje.getFullYear(), hoje.getMonth(), 5).toISOString().split('T')[0],
            compradorId: compradores[0].id, // COMPRADOR EXEMPLO 1
            bazarId: bazarAtual,
            pagamento: "pix",
            creditoConsignatario: 120.00, // 80% de 150
            comissaoLoja: 30.00, // 20% de 150
            consignatarioId: itens[6].consignatarioId // CONSIGNATÁRIO EXEMPLO 2
        },
        {
            id: gerarId(),
            itemId: itens[7].id, // ITEM VENDIDO EXEMPLO 2
            precoVenda: 55.00,
            dataVenda: new Date(hoje.getFullYear(), hoje.getMonth(), 8).toISOString().split('T')[0],
            compradorId: compradores[1].id, // COMPRADOR EXEMPLO 2
            bazarId: bazarAtual,
            pagamento: "dinheiro",
            creditoConsignatario: 44.00, // 80% de 55
            comissaoLoja: 11.00, // 20% de 55
            consignatarioId: itens[7].consignatarioId // CONSIGNATÁRIO EXEMPLO 3
        }
    ];
    
    vendas = vendasExemplo;
    
    // Atualizar créditos dos consignatários baseado nas vendas
    vendas.forEach(venda => {
        const consignatario = consignatarios.find(c => c.id === venda.consignatarioId);
        if (consignatario) {
            consignatario.credito = (consignatario.credito || 0) + venda.creditoConsignatario;
        }
    });
    
    // Criar consumo de créditos de exemplo
    const consumosExemplo = [
        {
            id: gerarId(),
            consignatarioId: consignatarios[1].id, // CONSIGNATÁRIO EXEMPLO 2
            valor: 50.00,
            data: new Date(hoje.getFullYear(), hoje.getMonth(), 10).toISOString().split('T')[0],
            observacao: "Exemplo de uso de créditos - compra de acessórios",
            saldoAnterior: 120.00
        }
    ];
    
    consumosCreditos = consumosExemplo;
    
    // Ajustar saldo do consignatário que teve consumo
    const consignatarioConsumo = consignatarios.find(c => c.id === consumosExemplo[0].consignatarioId);
    if (consignatarioConsumo) {
        consignatarioConsumo.credito -= 50.00;
    }
    
    // Salvar tudo
    salvarDados();
    
    // Atualizar a interface
    init();
    
    mostrarNotificacao("Dados de exemplo carregados com sucesso! Agora você pode testar todas as funcionalidades.", "sucesso");
    
    // Abrir o dashboard para mostrar os dados
    abrirTab('dashboard');
}
/* ============================================================
   15. RELATÓRIOS PDF - CORRIGIDO E SIMPLIFICADO
   (Requer apenas as funções formatarMoeda e formatarData)
// reports.js - Funções de relatório reescritas e padronizadas
// Dependências esperadas no escopo global: jsPDF (window.jspdf), doc.autoTable, e arrays: itens, vendas, bazares, consignatarios, compradores, consumosCreditos, configuracoes

/* --------------------------------------------------
   Helpers comuns para os relatórios
   --------------------------------------------------*/

function _safeNumber(v, fallback = 0) {
  return (typeof v === 'number' && !isNaN(v)) ? v : fallback;
}

function _formatMoeda(v) {
  return formatarMoeda ? formatarMoeda(v) : (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function _formatData(d) {
  try {
    return formatarData(new Date(d));
  } catch (e) {
    return d ? String(d) : '-';
  }
}

function _maxOrFallback(arr, accessor = x => x, fallback = 0) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const values = arr.map(accessor).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return fallback;
  return Math.max(...values);
}

function _minOrFallback(arr, accessor = x => x, fallback = 0) {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  const values = arr.map(accessor).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return fallback;
  return Math.min(...values);
}

function _adicionarRodape(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    const text = `Sistema BazarPlus - Relatórios Gerenciais`;
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    doc.text(text, doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }
}

function _criarCabecalhoPadrao(doc, titulo) {
  const now = new Date().toLocaleString('pt-BR');
  // retângulo colorido superior
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, doc.internal.pageSize.getWidth() / 2, 14, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sistema BazarPlus - Gerado em: ${now}`, 14, 30);
}

// Retorna um y seguro após a última tabela do autoTable (ou top estiver livre)
function _getFinalY(doc, fallback = 40) {
  try {
    return doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : fallback;
  } catch (e) {
    return fallback;
  }
}

/* --------------------------------------------------
   Relatório: Vendas por Bazar
   --------------------------------------------------*/
function gerarRelatorioVendasPorBazarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  _criarCabecalhoPadrao(doc, 'RELATÓRIO DETALHADO DE VENDAS POR BAZAR');

  // Totais gerais
  const totalGeralVendas = vendas.reduce((acc, v) => acc + _safeNumber(v.precoVenda), 0);
  const totalGeralComissao = vendas.reduce((acc, v) => acc + _safeNumber(v.comissaoLoja), 0);
  const totalGeralCreditos = vendas.reduce((acc, v) => acc + _safeNumber(v.creditoConsignatario), 0);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO EXECUTIVO', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total em Vendas: ${_formatMoeda(totalGeralVendas)}`, 14, 48);
  doc.text(`Comissão da Loja: ${_formatMoeda(totalGeralComissao)}`, 14, 54);
  doc.text(`Créditos Gerados: ${_formatMoeda(totalGeralCreditos)}`, 14, 60);
  doc.text(`Bazares Ativos: ${bazares.filter(b => b.status === 'ativo').length}`, 120, 48);
  doc.text(`Consignatários: ${consignatarios.filter(c => c.status === 'ativo').length}`, 120, 54);
  doc.text(`Itens Vendidos: ${itens.filter(i => i.status === 'vendido').length}`, 120, 60);

  let startY = 70;

  // Agrupar vendas por bazar, mantendo ordem decrescente por total
  const vendasPorBazar = {};
  bazares.forEach(bazar => {
    const vendasBazar = vendas.filter(v => v.bazarId === bazar.id);
    if (vendasBazar.length > 0) {
      vendasPorBazar[bazar.id] = {
        bazar,
        vendas: vendasBazar,
        total: vendasBazar.reduce((acc, v) => acc + _safeNumber(v.precoVenda), 0),
        comissao: vendasBazar.reduce((acc, v) => acc + _safeNumber(v.comissaoLoja), 0),
        creditos: vendasBazar.reduce((acc, v) => acc + _safeNumber(v.creditoConsignatario), 0)
      };
    }
  });

  const bazaresOrdenados = Object.values(vendasPorBazar).sort((a, b) => b.total - a.total);

  bazaresOrdenados.forEach((dadosBazar, index) => {
    const yBefore = _getFinalY(doc, startY);

    // Header do bazar
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yBefore, doc.internal.pageSize.getWidth() - 28, 12, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${dadosBazar.bazar.nome}`, 16, yBefore + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Data: ${_formatData(dadosBazar.bazar.inicio)}`, doc.internal.pageSize.getWidth() - 120, yBefore + 8);
    doc.text(`Total: ${_formatMoeda(dadosBazar.total)}`, doc.internal.pageSize.getWidth() - 70, yBefore + 8);

    // preparar linhas para autoTable
    const linhas = dadosBazar.vendas.map(v => {
      const item = itens.find(i => i.id == v.itemId) || {};
      const comprador = compradores.find(c => c.id == v.compradorId) || {};
      const consignatario = consignatarios.find(c => c.id == v.consignatarioId) || {};
      return [
        _formatData(v.dataVenda),
        (item.descricao || '-').toString().substring(0, 40),
        (comprador.nome || '-').toString().substring(0, 24),
        (consignatario.nome || '-').toString().substring(0, 24),
        v.pagamento || '-',
        _formatMoeda(v.precoVenda),
        _formatMoeda(v.creditoConsignatario),
        _formatMoeda(v.comissaoLoja)
      ];
    });

    doc.autoTable({
      head: [['Data', 'Item', 'Comprador', 'Consignatário', 'Pagamento', 'Valor', 'Crédito', 'Comissão']],
      body: linhas,
      startY: yBefore + 15,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 },
      didDrawPage: function (data) {
        // nada extra aqui; rodapé será adicionado ao final
      }
    });

    // resumo do bazar
    const yAfter = _getFinalY(doc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RESUMO DO BAZAR:', 16, yAfter + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Vendido: ${_formatMoeda(dadosBazar.total)}`, 80, yAfter + 6);
    doc.text(`Comissão Loja: ${_formatMoeda(dadosBazar.comissao)}`, 140, yAfter + 6);
    doc.text(`Créditos Gerados: ${_formatMoeda(dadosBazar.creditos)}`, 200, yAfter + 6);

    startY = yAfter + 18;
  });

  // Totais gerais finais
  const yFinal = _getFinalY(doc, startY + 8);
  doc.setFillColor(220, 220, 220);
  doc.rect(14, yFinal, doc.internal.pageSize.getWidth() - 28, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAIS GERAIS DO SISTEMA', 16, yFinal + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Geral em Vendas: ${_formatMoeda(totalGeralVendas)}`, 16, yFinal + 20);
  doc.text(`Comissão Total da Loja: ${_formatMoeda(totalGeralComissao)}`, 16, yFinal + 28);
  doc.text(`Créditos Totais Gerados: ${_formatMoeda(totalGeralCreditos)}`, 16, yFinal + 36);

  _adicionarRodape(doc);
  doc.save('relatorio_vendas_bazar_detalhado.pdf');
}

/* --------------------------------------------------
   Relatório: Vendas por Consignatário
   --------------------------------------------------*/
function gerarRelatorioVendasPorConsignatarioPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  _criarCabecalhoPadrao(doc, 'RELATÓRIO DE VENDAS POR CONSIGNATÁRIO');

  // Preparar dados
  const dadosConsignatarios = consignatarios.map(c => {
    const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
    const itensCons = itens.filter(i => i.consignatarioId === c.id);
    const itensVendidos = itensCons.filter(i => i.status === 'vendido');
    const totalVendido = vendasCons.reduce((acc, v) => acc + _safeNumber(v.precoVenda), 0);
    const totalCreditos = vendasCons.reduce((acc, v) => acc + _safeNumber(v.creditoConsignatario), 0);
    const totalComissao = vendasCons.reduce((acc, v) => acc + _safeNumber(v.comissaoLoja), 0);

    return {
      ...c,
      vendas: vendasCons.length,
      itensCadastrados: itensCons.length,
      itensVendidos: itensVendidos.length,
      totalVendido,
      totalCreditos,
      totalComissao,
      saldoAtual: c.credito || 0,
      taxaConversao: itensCons.length > 0 ? ((itensVendidos.length / itensCons.length) * 100).toFixed(1) + '%' : '0%'
    };
  }).filter(c => c.vendas > 0)
    .sort((a, b) => b.totalVendido - a.totalVendido);

  const totalGeralVendas = dadosConsignatarios.reduce((acc, c) => acc + _safeNumber(c.totalVendido), 0);
  const totalGeralCreditos = dadosConsignatarios.reduce((acc, c) => acc + _safeNumber(c.totalCreditos), 0);

  // Resumo executivo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO EXECUTIVO', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total em Vendas: ${_formatMoeda(totalGeralVendas)}`, 14, 48);
  doc.text(`Créditos Gerados: ${_formatMoeda(totalGeralCreditos)}`, 14, 54);
  doc.text(`Consignatários com Vendas: ${dadosConsignatarios.length}`, 14, 60);
  doc.text(`Ticket Médio: ${dadosConsignatarios.length > 0 && vendas.length > 0 ? _formatMoeda(totalGeralVendas / vendas.length) : _formatMoeda(0)}`, 120, 48);
  doc.text(`Melhor Consignatário: ${dadosConsignatarios[0] ? dadosConsignatarios[0].nome : 'N/A'}`, 120, 54);
  doc.text(`Maior Venda: ${vendas.length > 0 ? _formatMoeda(_maxOrFallback(vendas, v => v.precoVenda, 0)) : _formatMoeda(0)}`, 120, 60);

  // Tabela principal
  const linhas = dadosConsignatarios.map((c, index) => [
    (index + 1).toString(),
    c.nome,
    c.vendas.toString(),
    c.itensCadastrados.toString(),
    c.itensVendidos.toString(),
    c.taxaConversao,
    _formatMoeda(c.totalVendido),
    _formatMoeda(c.totalCreditos),
    _formatMoeda(c.saldoAtual),
    _formatMoeda(c.totalComissao)
  ]);

  doc.autoTable({
    head: [["#", "Consignatário", "Vendas", "Itens Cad.", "Itens Vend.", "Taxa Conv.", "Total Vendido", "Créditos Gerados", "Saldo Atual", "Comissão Loja"]],
    body: linhas,
    startY: 70,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontSize: 8 }
  });

  // Análise de performance (após tabela)
  const finalY = _getFinalY(doc, 70 + 8);
  if (finalY < doc.internal.pageSize.getHeight() - 40) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ANÁLISE DE PERFORMANCE', 14, finalY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const top3 = dadosConsignatarios.slice(0, 3);
    top3.forEach((c, idx) => {
      doc.text(`${idx + 1}º - ${c.nome}: ${_formatMoeda(c.totalVendido)} (${c.vendas} vendas)`, 16, finalY + 18 + idx * 6);
    });

    if (vendas.length > 0) {
      doc.text(`Maior Venda Individual: ${_formatMoeda(_maxOrFallback(vendas, v => v.precoVenda, 0))}`, 150, finalY + 18);
      doc.text(`Menor Venda Individual: ${_formatMoeda(_minOrFallback(vendas, v => v.precoVenda, 0))}`, 150, finalY + 24);
      doc.text(`Venda Média: ${_formatMoeda(totalGeralVendas / vendas.length)}`, 150, finalY + 30);
    }
  }

  _adicionarRodape(doc);
  doc.save('relatorio_vendas_consignatarios.pdf');
}

/* --------------------------------------------------
   Relatório: Vendas por Mês
   --------------------------------------------------*/
function gerarRelatorioVendasPorMesPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  _criarCabecalhoPadrao(doc, `RELATÓRIO DE VENDAS POR MÊS - ${new Date().getFullYear()}`);

  const anoAtual = new Date().getFullYear();
  const vendasDoAno = vendas.filter(v => new Date(v.dataVenda).getFullYear() === anoAtual);
  const vendasPorMes = {};

  vendasDoAno.forEach(v => {
    const mes = new Date(v.dataVenda).getMonth();
    if (!vendasPorMes[mes]) vendasPorMes[mes] = { vendas: [], total: 0, comissao: 0, creditos: 0 };
    vendasPorMes[mes].vendas.push(v);
    vendasPorMes[mes].total += _safeNumber(v.precoVenda);
    vendasPorMes[mes].comissao += _safeNumber(v.comissaoLoja);
    vendasPorMes[mes].creditos += _safeNumber(v.creditoConsignatario);
  });

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const linhas = [];
  let totalAno = 0, totalComissaoAno = 0, totalCreditosAno = 0;

  meses.forEach((mesNome, mesIndex) => {
    const dadosMes = vendasPorMes[mesIndex] || { vendas: [], total: 0, comissao: 0, creditos: 0 };
    linhas.push([
      mesNome,
      dadosMes.vendas.length.toString(),
      _formatMoeda(dadosMes.total),
      _formatMoeda(dadosMes.comissao),
      _formatMoeda(dadosMes.creditos),
      dadosMes.vendas.length > 0 ? _formatMoeda(dadosMes.total / dadosMes.vendas.length) : _formatMoeda(0)
    ]);

    totalAno += dadosMes.total;
    totalComissaoAno += dadosMes.comissao;
    totalCreditosAno += dadosMes.creditos;
  });

  // Resumo executivo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RESUMO EXECUTIVO DO ANO', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total do Ano: ${_formatMoeda(totalAno)}`, 14, 48);
  doc.text(`Comissão do Ano: ${_formatMoeda(totalComissaoAno)}`, 14, 54);
  doc.text(`Créditos do Ano: ${_formatMoeda(totalCreditosAno)}`, 14, 60);
  doc.text(`Vendas no Ano: ${vendasDoAno.length}`, 120, 48);

  const mesMaisVendas = Object.keys(vendasPorMes).length > 0
    ? meses[Object.keys(vendasPorMes).reduce((a, b) => vendasPorMes[a].vendas.length > vendasPorMes[b].vendas.length ? a : b)]
    : 'N/A';

  doc.text(`Mês com Mais Vendas: ${mesMaisVendas}`, 120, 54);
  doc.text(`Ticket Médio Anual: ${vendasDoAno.length > 0 ? _formatMoeda(totalAno / vendasDoAno.length) : _formatMoeda(0)}`, 120, 60);

  doc.autoTable({
    head: [["Mês", "Qtd Vendas", "Total Vendido", "Comissão Loja", "Créditos Gerados", "Ticket Médio"]],
    body: linhas,
    startY: 70,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [100, 100, 100], textColor: 255 }
  });

  // Gráfico simples em barras (desenhado com retângulos)
  const finalY = _getFinalY(doc, 70 + 8);
  if (finalY < doc.internal.pageSize.getHeight() - 40) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('DISTRIBUIÇÃO DE VENDAS POR MÊS', 14, finalY + 8);

    const maxTotal = Math.max(0, ...Object.values(vendasPorMes).map(m => m.total));
    let yChart = finalY + 16;
    meses.forEach((mesNome, mesIndex) => {
      const dados = vendasPorMes[mesIndex] || { total: 0 };
      const percentual = maxTotal > 0 ? (dados.total / maxTotal) : 0;
      const barWidth = percentual * (doc.internal.pageSize.getWidth() - 200);
      doc.setFillColor(139, 92, 246);
      doc.rect(60, yChart, barWidth, 6, 'F');
      doc.setFontSize(8);
      doc.text(mesNome.substring(0, 3), 44, yChart + 5);
      doc.text(_formatMoeda(dados.total), doc.internal.pageSize.getWidth() - 80, yChart + 5);
      yChart += 8;
    });
  }

  _adicionarRodape(doc);
  doc.save(`relatorio_vendas_mensal_${anoAtual}.pdf`);
}

/* --------------------------------------------------
   Relatório: Créditos
   --------------------------------------------------*/
function gerarRelatorioCreditosPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');

  _criarCabecalhoPadrao(doc, 'RELATÓRIO DE SALDOS DE CRÉDITOS');

  const dadosConsignatarios = consignatarios.map(c => {
    const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
    const itensVendidos = itens.filter(i => i.consignatarioId === c.id && i.status === 'vendido');
    const consumos = consumosCreditos.filter(cons => cons.consignatarioId === c.id);
    const totalConsumido = consumos.reduce((acc, cons) => acc + _safeNumber(cons.valor), 0);
    return {
      ...c,
      vendas: vendasCons.length,
      itensVendidos: itensVendidos.length,
      totalCreditosGerados: vendasCons.reduce((acc, v) => acc + _safeNumber(v.creditoConsignatario), 0),
      totalConsumido,
      saldoAtual: c.credito || 0,
      ultimoConsumo: consumos.length > 0 ? new Date(Math.max(...consumos.map(cc => new Date(cc.data)))) : null
    };
  }).sort((a, b) => b.saldoAtual - a.saldoAtual);

  const totalSaldos = dadosConsignatarios.reduce((acc, c) => acc + _safeNumber(c.saldoAtual), 0);
  const totalCreditosGerados = dadosConsignatarios.reduce((acc, c) => acc + _safeNumber(c.totalCreditosGerados), 0);
  const totalConsumido = dadosConsignatarios.reduce((acc, c) => acc + _safeNumber(c.totalConsumido), 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RESUMO EXECUTIVO DE CRÉDITOS', 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Saldo Total em Créditos: ${_formatMoeda(totalSaldos)}`, 14, 48);
  doc.text(`Créditos Gerados: ${_formatMoeda(totalCreditosGerados)}`, 14, 54);
  doc.text(`Créditos Consumidos: ${_formatMoeda(totalConsumido)}`, 14, 60);
  doc.text(`Consignatários com Saldo: ${dadosConsignatarios.filter(c => c.saldoAtual > 0).length}`, 120, 48);
  doc.text(`Maior Saldo: ${dadosConsignatarios.length > 0 ? _formatMoeda(dadosConsignatarios[0].saldoAtual) : _formatMoeda(0)}`, 120, 54);
  doc.text(`Taxa de Uso: ${totalCreditosGerados > 0 ? ((totalConsumido / totalCreditosGerados) * 100).toFixed(1) + '%' : '0%'}`, 120, 60);

  const linhas = dadosConsignatarios.map((c, index) => [
    (index + 1).toString(),
    c.nome,
    c.vendas.toString(),
    c.itensVendidos.toString(),
    _formatMoeda(c.totalCreditosGerados),
    _formatMoeda(c.totalConsumido),
    _formatMoeda(c.saldoAtual),
    c.ultimoConsumo ? _formatData(c.ultimoConsumo) : 'Nunca',
    c.status
  ]);

  doc.autoTable({
    head: [["#", "Consignatário", "Vendas", "Itens Vend.", "Créditos Gerados", "Créditos Usados", "Saldo Atual", "Últ. Consumo", "Status"]],
    body: linhas,
    startY: 72,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [100, 100, 100], textColor: 255 }
  });

  _adicionarRodape(doc);
  doc.save('relatorio_saldos_creditos.pdf');
}

/* ============================================================
   17. INICIALIZAÇÃO FINAL
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    carregarTema();
    init();

    // Configurar data atual para formulários
    const hoje = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = hoje;
        }
    });
});
