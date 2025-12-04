/* =====================================================================
   SISTEMA DESAPEGOPLUS – script.js (COMPLETO COM TODAS AS ATUALIZAÇÕES)
   ===================================================================== */

/* ---------------------------------------------------------
   1. VARIÁVEIS GLOBAIS
--------------------------------------------------------- */
let itens = [];
let vendas = [];
let desapegos = [];
let consignatarios = [];
let compradores = [];
let consumosCreditos = [];

let desapegoAtual = null;

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
    localStorage.setItem("desapegoplus_db", JSON.stringify({
        itens,
        vendas,
        desapegos,
        consignatarios,
        compradores,
        consumosCreditos,
        configuracoes,
        desapegoAtual
    }));
}

function carregarDados() {
    const db = localStorage.getItem("desapegoplus_db");
    if (!db) return;

    const dados = JSON.parse(db);

    itens = dados.itens || [];
    vendas = dados.vendas || [];
    desapegos = dados.desapegos || [];
    consignatarios = dados.consignatarios || [];
    compradores = dados.compradores || [];
    consumosCreditos = dados.consumosCreditos || [];
    configuracoes = dados.configuracoes || configuracoes;
    desapegoAtual = dados.desapegoAtual || null;
}

/* ---------------------------------------------------------
   3. INICIALIZAÇÃO GERAL
--------------------------------------------------------- */
function init() {
    carregarDados();
    carregarConfiguracoes();
    renderizarDesapegos();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarCompradores();
    renderizarOpcoesSelects();
    renderizarDashboard();
    renderizarConsumosCreditos();
    
    // Configurar percentual padrão
    document.getElementById("percentualParceira").value = configuracoes.percentualConsignatario;
    document.getElementById("percentualLoja").value = configuracoes.percentualLoja;
    
    // Atualizar informação de backup
    atualizarInfoBackup();
    
    // Configurar data atual para formulários
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('desapegoData').value = hoje;
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
   5. DESAPEGOS
============================================================ */
function criardesapego() {
    const nome = document.getElementById("desapegoNome").value.trim();
    const data = document.getElementById("desapegoData").value;
    const tema = document.getElementById("desapegoTema").value.trim();
    const observacao = document.getElementById("desapegoObservacao").value.trim();

    if (!nome || !data) {
        mostrarNotificacao("Preencha nome e data do desapego!", "erro");
        return;
    }

    const desapego = {
        id: gerarId(),
        nome,
        inicio: data,
        tema,
        observacao,
        status: "ativo"
    };

    desapegos.push(desapego);
    desapegoAtual = desapego.id;

    salvarDados();
    renderizarDesapegos();
    renderizarOpcoesSelects();

    document.getElementById("desapegoNome").value = "";
    document.getElementById("desapegoData").value = "";
    document.getElementById("desapegoTema").value = "";
    document.getElementById("desapegoObservacao").value = "";
    
    mostrarNotificacao("Desapego criado com sucesso!", "sucesso");
}

function limparFormulariodesapego() {
    document.getElementById("desapegoNome").value = "";
    document.getElementById("desapegoData").value = "";
    document.getElementById("desapegoTema").value = "";
    document.getElementById("desapegoObservacao").value = "";
    
    const btn = document.querySelector('#desapegos .btn-primary');
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Criar Desapego';
    btn.onclick = function() { criardesapego(); };
    document.getElementById("desapegoIdEdit").value = "";
}

function renderizarDesapegos() {
    const tbody = document.getElementById("listaDesapegos");
    if (!tbody) return;

    tbody.innerHTML = "";

    desapegos.forEach(b => {
        const itensDesapego = itens.filter(i => i.desapegoId === b.id).length;
        const vendidos = itens.filter(i => i.desapegoId === b.id && i.status === "vendido").length;
        const totalVendas = vendas.filter(v => v.desapegoId === b.id)
            .reduce((acc, v) => acc + v.precoVenda, 0);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.nome}</td>
            <td>${formatarData(b.inicio)}</td>
            <td>${b.tema || '-'}</td>
            <td>${vendidos}</td>
            <td>${formatarMoeda(totalVendas)}</td>
            <td><span class="status-badge ${b.status}">${b.status}</span></td>
            <td class="table-actions">
                <button onclick="definirDesapegoAtual(${b.id})" title="Selecionar">
                    <i class="fas fa-hand-pointer"></i>
                </button>
                <button onclick="editarDesapego(${b.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="excluirDesapego(${b.id})" title="Excluir" class="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function definirDesapegoAtual(id) {
    desapegoAtual = id;
    salvarDados();
    renderizarDesapegos();
    renderizarDashboard();
    mostrarNotificacao("Desapego selecionado com sucesso!", "sucesso");
}

function excluirDesapego(id) {
    if (!confirm("Tem certeza que deseja excluir este desapego?")) return;
    
    desapegos = desapegos.filter(b => b.id !== id);
    if (desapegoAtual === id) {
        desapegoAtual = null;
    }
    
    salvarDados();
    renderizarDesapegos();
    renderizarOpcoesSelects();
    mostrarNotificacao("Desapego excluído com sucesso!", "sucesso");
}

function editarDesapego(id) {
    const desapego = desapegos.find(b => b.id === id);
    if (!desapego) return;
    
    document.getElementById("desapegoIdEdit").value = desapego.id;
    document.getElementById("desapegoNome").value = desapego.nome;
    document.getElementById("desapegoData").value = desapego.inicio;
    document.getElementById("desapegoTema").value = desapego.tema || '';
    document.getElementById("desapegoObservacao").value = desapego.observacao || '';
    
    const btn = document.querySelector('#desapegos .btn-primary');
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar Desapego';
    btn.onclick = function() { atualizarDesapego(desapego.id); };
    
    mostrarNotificacao(`Editando desapego: ${desapego.nome}`, "info");
}

function atualizarDesapego(id) {
    const nome = document.getElementById("desapegoNome").value.trim();
    const data = document.getElementById("desapegoData").value;
    const tema = document.getElementById("desapegoTema").value.trim();
    const observacao = document.getElementById("desapegoObservacao").value.trim();

    if (!nome || !data) {
        mostrarNotificacao("Preencha nome e data do desapego!", "erro");
        return;
    }

    const desapegoIndex = desapegos.findIndex(b => b.id === id);
    if (desapegoIndex !== -1) {
        desapegos[desapegoIndex] = {
            ...desapegos[desapegoIndex],
            nome,
            inicio: data,
            tema,
            observacao
        };

        salvarDados();
        renderizarDesapegos();
        
        limparFormulariodesapego();
        mostrarNotificacao("Desapego atualizado com sucesso!", "sucesso");
    }
}

function compararDesapegos() {
    if (desapegos.length < 2) {
        mostrarNotificacao("É necessário ter pelo menos 2 desapegos para comparar", "erro");
        return;
    }
    
    const desapego1 = desapegos[0];
    const desapego2 = desapegos[1];
    
    const vendasDesapego1 = vendas.filter(v => v.desapegoId === desapego1.id);
    const vendasDesapego2 = vendas.filter(v => v.desapegoId === desapego2.id);
    
    const totalDesapego1 = vendasDesapego1.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalDesapego2 = vendasDesapego2.reduce((acc, v) => acc + v.precoVenda, 0);
    
    mostrarNotificacao(
        `Comparação: ${desapego1.nome} (${formatarMoeda(totalDesapego1)}) vs ${desapego2.nome} (${formatarMoeda(totalDesapego2)})`, 
        "info"
    );
}

/* ============================================================
   6. VENDAS COMPLETAS (NOVA LÓGICA)
============================================================ */

// Funções para toggle dos formulários
function toggleNovaParceira() {
    const selecionarDiv = document.getElementById("selecionar-parceira");
    const novaDiv = document.getElementById("nova-parceira");
    
    if (novaDiv.style.display === "none") {
        novaDiv.style.display = "block";
        selecionarDiv.style.display = "none";
        document.getElementById("vendaParceiraExistente").value = "";
    } else {
        novaDiv.style.display = "none";
        selecionarDiv.style.display = "block";
        limparNovaParceira();
    }
}

function toggleNovoComprador() {
    const selecionarDiv = document.getElementById("selecionar-comprador");
    const novaDiv = document.getElementById("novo-comprador");
    
    if (novaDiv.style.display === "none") {
        novaDiv.style.display = "block";
        selecionarDiv.style.display = "none";
        document.getElementById("vendaCompradorExistente").value = "";
    } else {
        novaDiv.style.display = "none";
        selecionarDiv.style.display = "block";
        limparNovoComprador();
    }
}

function carregarParceiraExistente() {
    calcularResumoVenda();
}

function limparNovaParceira() {
    document.getElementById("novaParceiraNome").value = "";
    document.getElementById("novaParceiraTelefone").value = "";
    document.getElementById("novaParceiraEmail").value = "";
}

function limparNovoComprador() {
    document.getElementById("novoCompradorNome").value = "";
    document.getElementById("novoCompradorTelefone").value = "";
    document.getElementById("novoCompradorEmail").value = "";
}

// Função principal para registrar venda completa
function registrarVendaCompleta() {
    // Verificar se é edição
    const vendaIdEdit = document.getElementById("vendaIdEdit");
    if (vendaIdEdit && vendaIdEdit.value) {
        atualizarVenda(parseInt(vendaIdEdit.value));
        return;
    }

    // 1. VALIDAR E OBTER DADOS DA PARCEIRA
    let parceiraId;
    const parceiraExistente = document.getElementById("vendaParceiraExistente").value;
    const novaParceiraDiv = document.getElementById("nova-parceira");
    
    if (novaParceiraDiv.style.display !== "none") {
        const nome = document.getElementById("novaParceiraNome").value.trim();
        const telefone = document.getElementById("novaParceiraTelefone").value.trim();
        const email = document.getElementById("novaParceiraEmail").value.trim();
        
        if (!nome || !telefone) {
            mostrarNotificacao("Preencha nome e telefone da parceira!", "erro");
            return;
        }
        
        const novaParceira = {
            id: gerarId(),
            nome,
            telefone,
            email,
            credito: 0,
            status: "ativo"
        };
        
        consignatarios.push(novaParceira);
        parceiraId = novaParceira.id;
        mostrarNotificacao("Nova parceira cadastrada!", "sucesso");
    } else {
        if (!parceiraExistente) {
            mostrarNotificacao("Selecione uma parceira!", "erro");
            return;
        }
        parceiraId = parseInt(parceiraExistente);
    }

    // 2. VALIDAR DADOS DO ITEM
    const descricao = document.getElementById("itemDescricao").value.trim();
    const categoria = document.getElementById("itemCategoria").value;
    const preco = parseFloat(document.getElementById("itemPreco").value);
    const tamanho = document.getElementById("itemTamanho").value.trim();
    const marca = document.getElementById("itemMarca").value.trim();
    const estado = document.getElementById("itemEstado").value;
    const observacaoItem = document.getElementById("itemObservacao").value.trim();

    if (!descricao || isNaN(preco) || preco <= 0) {
        mostrarNotificacao("Preencha descrição e preço do item!", "erro");
        return;
    }

    // 3. VALIDAR E OBTER DADOS DO COMPRADOR
    let compradorId;
    const compradorExistente = document.getElementById("vendaCompradorExistente").value;
    const novoCompradorDiv = document.getElementById("novo-comprador");
    
    if (novoCompradorDiv.style.display !== "none") {
        const nomeComprador = document.getElementById("novoCompradorNome").value.trim();
        const telefoneComprador = document.getElementById("novoCompradorTelefone").value.trim();
        const emailComprador = document.getElementById("novoCompradorEmail").value.trim();
        
        if (!nomeComprador || !telefoneComprador) {
            mostrarNotificacao("Preencha nome e telefone do comprador!", "erro");
            return;
        }
        
        const novoComprador = {
            id: gerarId(),
            nome: nomeComprador,
            telefone: telefoneComprador,
            email: emailComprador,
            status: "ativo"
        };
        
        compradores.push(novoComprador);
        compradorId = novoComprador.id;
        mostrarNotificacao("Novo comprador cadastrado!", "sucesso");
    } else {
        if (!compradorExistente) {
            mostrarNotificacao("Selecione um comprador!", "erro");
            return;
        }
        compradorId = parseInt(compradorExistente);
    }

    // 4. VALIDAR DADOS DA VENDA
    const formaPagamento = document.getElementById("vendaFormaPagamento").value;
    const dataVenda = document.getElementById("vendaData").value;
    const desapegoId = document.getElementById("vendaDesapego").value;

    if (!desapegoId) {
        mostrarNotificacao("Selecione o desapego!", "erro");
        return;
    }

    // 5. CRIAR ITEM
    const itemId = gerarId();
    const item = {
        id: itemId,
        descricao,
        categoria,
        preco,
        tamanho,
        marca,
        estado,
        consignatarioId: parceiraId,
        observacao: observacaoItem,
        desapegoId: parseInt(desapegoId),
        status: "vendido",
        dataCadastro: new Date().toISOString()
    };

    itens.push(item);

    // 6. CALCULAR CRÉDITOS E COMISSÃO
    const creditoParceira = preco * (configuracoes.percentualConsignatario / 100);
    const comissaoLoja = preco * (configuracoes.percentualLoja / 100);

    // 7. REGISTRAR VENDA
    const statusPagamento = formaPagamento === 'Aguardando Pagamento' ? 'pendente' : 'pago';
    
    const venda = {
        id: gerarId(),
        itemId: itemId,
        precoVenda: preco,
        dataVenda: dataVenda,
        compradorId: compradorId,
        desapegoId: parseInt(desapegoId),
        pagamento: formaPagamento,
        creditoConsignatario: statusPagamento === 'pendente' ? 0 : creditoParceira,
        comissaoLoja: statusPagamento === 'pendente' ? 0 : comissaoLoja,
        consignatarioId: parceiraId,
        statusPagamento: statusPagamento
    };

    vendas.push(venda);

    // 8. ATUALIZAR CRÉDITO DA PARCEIRA (apenas se pago)
    if (statusPagamento === 'pago') {
        const parceira = consignatarios.find(c => c.id === parceiraId);
        if (parceira) {
            parceira.credito = (parceira.credito || 0) + creditoParceira;
        }
    }

    // 9. SALVAR E ATUALIZAR TUDO
    salvarDados();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarCompradores();
    renderizarDashboard();
    renderizarOpcoesSelects();

    limparFormularioVendaCompleta();
    mostrarNotificacao("Venda registrada com sucesso!", "sucesso");
}

function limparFormularioVendaCompleta() {
    document.getElementById("vendaParceiraExistente").selectedIndex = 0;
    document.getElementById("selecionar-parceira").style.display = "block";
    document.getElementById("nova-parceira").style.display = "none";
    limparNovaParceira();
    
    document.getElementById("itemDescricao").value = "";
    document.getElementById("itemCategoria").selectedIndex = 0;
    document.getElementById("itemPreco").value = "";
    document.getElementById("itemTamanho").value = "";
    document.getElementById("itemMarca").value = "";
    document.getElementById("itemEstado").selectedIndex = 0;
    document.getElementById("itemObservacao").value = "";
    
    document.getElementById("vendaCompradorExistente").selectedIndex = 0;
    document.getElementById("selecionar-comprador").style.display = "block";
    document.getElementById("novo-comprador").style.display = "none";
    limparNovoComprador();
    
    document.getElementById("vendaDesapego").selectedIndex = 0;
    document.getElementById("vendaData").value = new Date().toISOString().split('T')[0];
    document.getElementById("vendaFormaPagamento").selectedIndex = 0;
    
    // Remover campo oculto de edição
    const vendaIdEdit = document.getElementById("vendaIdEdit");
    if (vendaIdEdit) {
        vendaIdEdit.remove();
    }
    
    const btnRegistrar = document.querySelector('#vendas .btn-success');
    if (btnRegistrar) {
        btnRegistrar.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Venda Completa';
        btnRegistrar.setAttribute('onclick', 'registrarVendaCompleta()');
    }
    
    const resumoVenda = document.getElementById("resumoVenda");
    if (resumoVenda) {
        resumoVenda.style.display = "none";
    }
}

function calcularResumoVenda() {
    const preco = parseFloat(document.getElementById("itemPreco").value);
    const resumoDiv = document.getElementById("resumoVenda");
    const detalhesResumo = document.getElementById("detalhesResumoVenda");
    
    if (isNaN(preco) || preco <= 0) {
        if (resumoDiv) resumoDiv.style.display = "none";
        return;
    }

    const creditoParceira = preco * (configuracoes.percentualConsignatario / 100);
    const comissaoLoja = preco * (configuracoes.percentualLoja / 100);

    if (detalhesResumo) {
        detalhesResumo.innerHTML = `
            <p><strong>Valor da Venda:</strong> ${formatarMoeda(preco)}</p>
            <p><strong>Crédito da Parceira (${configuracoes.percentualConsignatario}%):</strong> ${formatarMoeda(creditoParceira)}</p>
            <p><strong>Comissão da Loja (${configuracoes.percentualLoja}%):</strong> ${formatarMoeda(comissaoLoja)}</p>
        `;
    }
    
    if (resumoDiv) {
        resumoDiv.style.display = "block";
    }
}

/* ============================================================
   7. FUNÇÕES PARA AGUARDANDO PAGAMENTO E EDIÇÃO DE VENDAS
============================================================ */

// Atualizar dashboard de aguardando pagamento
function atualizarDashboardAguardandoPagamento() {
    const vendasPendentes = vendas.filter(v => 
        v.statusPagamento === 'pendente'
    );
    
    const totalAguardando = vendasPendentes.reduce((acc, v) => acc + parseFloat(v.precoVenda || 0), 0);
    
    const elemento = document.getElementById('totalAguardandoPagamento');
    if (elemento) {
        elemento.textContent = `R$ ${totalAguardando.toFixed(2)}`;
    }
    
    // Atualizar progresso
    const totalVendas = vendas.reduce((acc, v) => acc + parseFloat(v.precoVenda || 0), 0);
    const percentual = totalVendas > 0 ? (totalAguardando / totalVendas) * 100 : 0;
    const progresso = document.getElementById('progressAguardando');
    if (progresso) {
        progresso.style.width = `${percentual}%`;
    }
    
    return totalAguardando;
}

// Confirmar pagamento de venda pendente
function confirmarPagamento(vendaId) {
    if (!confirm(`Confirmar pagamento da venda ${vendaId}?`)) {
        return;
    }
    
    const vendaIndex = vendas.findIndex(v => v.id == vendaId);
    
    if (vendaIndex === -1) {
        mostrarNotificacao('Venda não encontrada!', 'erro');
        return;
    }
    
    const venda = vendas[vendaIndex];
    const preco = parseFloat(venda.precoVenda) || 0;
    
    // Atualizar status da venda
    vendas[vendaIndex].statusPagamento = 'pago';
    vendas[vendaIndex].pagamento = 'Pagamento Confirmado';
    
    // Calcular crédito e comissão
    const creditoParceira = preco * (configuracoes.percentualConsignatario / 100);
    const comissaoLoja = preco * (configuracoes.percentualLoja / 100);
    
    // Atualizar créditos na venda
    vendas[vendaIndex].creditoConsignatario = creditoParceira;
    vendas[vendaIndex].comissaoLoja = comissaoLoja;
    
    // Atualizar saldo da parceira
    const parceiraIndex = consignatarios.findIndex(p => p.id === venda.consignatarioId);
    
    if (parceiraIndex !== -1) {
        consignatarios[parceiraIndex].credito = (consignatarios[parceiraIndex].credito || 0) + creditoParceira;
    }
    
    salvarDados();
    mostrarNotificacao(`Pagamento confirmado! R$ ${creditoParceira.toFixed(2)} em créditos adicionados para a parceira.`, 'sucesso');
    
    // Atualizar interface
    renderizarVendas();
    renderizarDashboard();
    atualizarDashboardAguardandoPagamento();
    if (document.getElementById('parceiras').classList.contains('active')) {
        renderizarConsignatarios();
    }
}

// Editar venda existente
function editarVenda(vendaId) {
    const venda = vendas.find(v => v.id == vendaId);
    
    if (!venda) {
        mostrarNotificacao('Venda não encontrada!', 'erro');
        return;
    }
    
    // Abrir aba de vendas
    abrirTab('vendas');
    
    // Preencher formulário
    setTimeout(() => {
        // Preencher dados do item
        const item = itens.find(i => i.id == venda.itemId);
        if (item) {
            document.getElementById('itemDescricao').value = item.descricao || '';
            document.getElementById('itemCategoria').value = item.categoria || 'roupa';
            document.getElementById('itemPreco').value = item.preco || '';
            document.getElementById('itemTamanho').value = item.tamanho || '';
            document.getElementById('itemMarca').value = item.marca || '';
            document.getElementById('itemEstado').value = item.estado || 'seminovo';
            document.getElementById('itemObservacao').value = item.observacao || '';
        }
        
        // Selecionar parceira
        const selectParceira = document.getElementById('vendaParceiraExistente');
        if (selectParceira) {
            selectParceira.value = venda.consignatarioId || '';
            // Ocultar formulário de nova parceira
            document.getElementById('nova-parceira').style.display = 'none';
            document.getElementById('selecionar-parceira').style.display = 'grid';
        }
        
        // Selecionar comprador
        const selectComprador = document.getElementById('vendaCompradorExistente');
        if (selectComprador) {
            selectComprador.value = venda.compradorId || '';
            // Ocultar formulário de novo comprador
            document.getElementById('novo-comprador').style.display = 'none';
            document.getElementById('selecionar-comprador').style.display = 'grid';
        }
        
        // Dados da venda
        document.getElementById('vendaDesapego').value = venda.desapegoId || '';
        document.getElementById('vendaData').value = venda.dataVenda || '';
        document.getElementById('vendaFormaPagamento').value = venda.pagamento || 'dinheiro';
        
        // Adicionar campo oculto para ID da venda
        let vendaIdEdit = document.getElementById('vendaIdEdit');
        if (!vendaIdEdit) {
            vendaIdEdit = document.createElement('input');
            vendaIdEdit.type = 'hidden';
            vendaIdEdit.id = 'vendaIdEdit';
            document.querySelector('#vendas .card').appendChild(vendaIdEdit);
        }
        vendaIdEdit.value = vendaId;
        
        // Mudar botão
        const btnRegistrar = document.querySelector('#vendas .btn-success');
        if (btnRegistrar) {
            btnRegistrar.innerHTML = '<i class="fas fa-save"></i> Atualizar Venda';
            btnRegistrar.setAttribute('onclick', `atualizarVenda(${vendaId})`);
        }
        
        // Rolar para o topo do formulário
        window.scrollTo({ top: document.getElementById('vendas').offsetTop - 100, behavior: 'smooth' });
        
        mostrarNotificacao('Modo edição ativado. Altere os dados e clique em "Atualizar Venda"', 'info');
    }, 300);
}

// Atualizar venda
function atualizarVenda(vendaId) {
    const vendaIndex = vendas.findIndex(v => v.id == vendaId);
    
    if (vendaIndex === -1) {
        mostrarNotificacao('Venda não encontrada!', 'erro');
        return;
    }
    
    // Coletar dados do formulário
    const dadosForm = coletarDadosVendaParaEdicao();
    
    if (!dadosForm) {
        return;
    }
    
    // Manter dados importantes
    dadosForm.id = parseInt(vendaId);
    dadosForm.statusPagamento = vendas[vendaIndex].statusPagamento || 
        (dadosForm.pagamento === 'Aguardando Pagamento' ? 'pendente' : 'pago');
    
    // Se a venda já estava paga, manter créditos
    if (dadosForm.statusPagamento === 'pago') {
        dadosForm.creditoConsignatario = vendas[vendaIndex].creditoConsignatario;
        dadosForm.comissaoLoja = vendas[vendaIndex].comissaoLoja;
    } else {
        // Recalcular créditos se necessário
        const preco = parseFloat(dadosForm.precoVenda) || 0;
        if (dadosForm.pagamento !== 'Aguardando Pagamento') {
            dadosForm.creditoConsignatario = preco * (configuracoes.percentualConsignatario / 100);
            dadosForm.comissaoLoja = preco * (configuracoes.percentualLoja / 100);
            dadosForm.statusPagamento = 'pago';
        } else {
            dadosForm.creditoConsignatario = 0;
            dadosForm.comissaoLoja = 0;
            dadosForm.statusPagamento = 'pendente';
        }
    }
    
    // Atualizar venda
    vendas[vendaIndex] = dadosForm;
    
    // Atualizar item associado
    const itemIndex = itens.findIndex(i => i.id == vendas[vendaIndex].itemId);
    if (itemIndex !== -1) {
        itens[itemIndex] = {
            ...itens[itemIndex],
            descricao: dadosForm.itemDescricao,
            categoria: dadosForm.categoria,
            preco: dadosForm.precoVenda,
            tamanho: dadosForm.tamanho,
            marca: dadosForm.marca,
            estado: dadosForm.estado,
            observacao: dadosForm.observacaoItem,
            consignatarioId: dadosForm.consignatarioId,
            desapegoId: dadosForm.desapegoId
        };
    }
    
    salvarDados();
    
    // Restaurar botão
    const btnRegistrar = document.querySelector('#vendas .btn-success');
    if (btnRegistrar) {
        btnRegistrar.innerHTML = '<i class="fas fa-check-circle"></i> Registrar Venda Completa';
        btnRegistrar.setAttribute('onclick', 'registrarVendaCompleta()');
    }
    
    // Remover campo oculto de edição
    const vendaIdEdit = document.getElementById('vendaIdEdit');
    if (vendaIdEdit) {
        vendaIdEdit.remove();
    }
    
    mostrarNotificacao('Venda atualizada com sucesso!', 'sucesso');
    limparFormularioVendaCompleta();
    renderizarVendas();
    renderizarDashboard();
    atualizarDashboardAguardandoPagamento();
}

// Função auxiliar: coletar dados do formulário para edição
function coletarDadosVendaParaEdicao() {
    // 1. VALIDAR E OBTER DADOS DA PARCEIRA
    let parceiraId;
    const parceiraExistente = document.getElementById("vendaParceiraExistente").value;
    const novaParceiraDiv = document.getElementById("nova-parceira");
    
    if (novaParceiraDiv.style.display !== "none") {
        const nome = document.getElementById("novaParceiraNome").value.trim();
        const telefone = document.getElementById("novaParceiraTelefone").value.trim();
        const email = document.getElementById("novaParceiraEmail").value.trim();
        
        if (!nome || !telefone) {
            mostrarNotificacao("Preencha nome e telefone da parceira!", "erro");
            return null;
        }
        
        const novaParceira = {
            id: gerarId(),
            nome,
            telefone,
            email,
            credito: 0,
            status: "ativo"
        };
        
        consignatarios.push(novaParceira);
        parceiraId = novaParceira.id;
    } else {
        if (!parceiraExistente) {
            mostrarNotificacao("Selecione uma parceira!", "erro");
            return null;
        }
        parceiraId = parseInt(parceiraExistente);
    }

    // 2. VALIDAR DADOS DO ITEM
    const descricao = document.getElementById("itemDescricao").value.trim();
    const categoria = document.getElementById("itemCategoria").value;
    const preco = parseFloat(document.getElementById("itemPreco").value);
    const tamanho = document.getElementById("itemTamanho").value.trim();
    const marca = document.getElementById("itemMarca").value.trim();
    const estado = document.getElementById("itemEstado").value;
    const observacaoItem = document.getElementById("itemObservacao").value.trim();

    if (!descricao || isNaN(preco) || preco <= 0) {
        mostrarNotificacao("Preencha descrição e preço do item!", "erro");
        return null;
    }

    // 3. VALIDAR E OBTER DADOS DO COMPRADOR
    let compradorId;
    const compradorExistente = document.getElementById("vendaCompradorExistente").value;
    const novoCompradorDiv = document.getElementById("novo-comprador");
    
    if (novoCompradorDiv.style.display !== "none") {
        const nomeComprador = document.getElementById("novoCompradorNome").value.trim();
        const telefoneComprador = document.getElementById("novoCompradorTelefone").value.trim();
        const emailComprador = document.getElementById("novoCompradorEmail").value.trim();
        
        if (!nomeComprador || !telefoneComprador) {
            mostrarNotificacao("Preencha nome e telefone do comprador!", "erro");
            return null;
        }
        
        const novoComprador = {
            id: gerarId(),
            nome: nomeComprador,
            telefone: telefoneComprador,
            email: emailComprador,
            status: "ativo"
        };
        
        compradores.push(novoComprador);
        compradorId = novoComprador.id;
    } else {
        if (!compradorExistente) {
            mostrarNotificacao("Selecione um comprador!", "erro");
            return null;
        }
        compradorId = parseInt(compradorExistente);
    }

    // 4. VALIDAR DADOS DA VENDA
    const formaPagamento = document.getElementById("vendaFormaPagamento").value;
    const dataVenda = document.getElementById("vendaData").value;
    const desapegoId = document.getElementById("vendaDesapego").value;

    if (!desapegoId) {
        mostrarNotificacao("Selecione o desapego!", "erro");
        return null;
    }

    // Criar novo itemId para evitar conflitos
    const novoItemId = gerarId();

    return {
        itemId: novoItemId,
        precoVenda: preco,
        dataVenda: dataVenda,
        compradorId: compradorId,
        desapegoId: parseInt(desapegoId),
        pagamento: formaPagamento,
        creditoConsignatario: 0,
        comissaoLoja: 0,
        consignatarioId: parceiraId,
        
        // Dados do item para referência
        itemDescricao: descricao,
        categoria: categoria,
        tamanho: tamanho,
        marca: marca,
        estado: estado,
        observacaoItem: observacaoItem
    };
}

function renderizarVendas() {
    const tbody = document.getElementById("listaVendas");
    if (!tbody) return;

    tbody.innerHTML = "";

    vendas.forEach(v => {
        const item = itens.find(i => i.id == v.itemId);
        const comprador = compradores.find(c => c.id == v.compradorId);
        const consignatario = consignatarios.find(c => c.id == v.consignatarioId);
        const desapego = desapegos.find(b => b.id == v.desapegoId);
        
        const statusPagamento = v.statusPagamento || (v.pagamento === 'Aguardando Pagamento' ? 'pendente' : 'pago');
        const statusText = statusPagamento === 'pago' ? 'Pago' : 'Pendente';
        const statusClass = statusPagamento === 'pago' ? 'pago' : 'pendente';

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${v.id}</td>
            <td>${formatarData(v.dataVenda)}</td>
            <td>${item ? item.descricao : "Item removido"}</td>
            <td>${desapego ? desapego.nome : "Desapego não encontrado"}</td>
            <td>${consignatario ? consignatario.nome : "Não informado"}</td>
            <td>${comprador ? comprador.nome : "Não informado"}</td>
            <td>${formatarMoeda(v.precoVenda)}</td>
            <td>${formatarMoeda(v.creditoConsignatario)}</td>
            <td>${formatarMoeda(v.comissaoLoja)}</td>
            <td>${v.pagamento}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="table-actions">
                <button onclick="editarVenda(${v.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="confirmarPagamento(${v.id})" 
                        class="${statusPagamento === 'pendente' ? 'btn-confirmar-pagamento' : ''}" 
                        title="Confirmar Pagamento"
                        ${statusPagamento === 'pago' ? 'disabled style="opacity:0.5"' : ''}>
                    <i class="fas fa-check-circle"></i>
                </button>
                <button onclick="excluirVenda(${v.id})" title="Excluir" class="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function excluirVenda(vendaId) {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) return;
    
    const vendaIndex = vendas.findIndex(v => v.id == vendaId);
    if (vendaIndex === -1) return;
    
    const venda = vendas[vendaIndex];
    const item = itens.find(i => i.id == venda.itemId);
    
    if (item) {
        const itemIndex = itens.findIndex(i => i.id == venda.itemId);
        if (itemIndex !== -1) {
            itens.splice(itemIndex, 1);
        }
    }
    
    // Reverter crédito da parceira se a venda já estava paga
    if (venda.statusPagamento === 'pago') {
        const consignatario = consignatarios.find(c => c.id == venda.consignatarioId);
        if (consignatario) {
            consignatario.credito = Math.max(0, (consignatario.credito || 0) - venda.creditoConsignatario);
        }
    }
    
    vendas.splice(vendaIndex, 1);
    
    salvarDados();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarDashboard();
    renderizarOpcoesSelects();
    
    mostrarNotificacao("Venda excluída com sucesso!", "sucesso");
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
    
    // Reverter crédito da parceira
    const consignatario = consignatarios.find(c => c.id == venda.consignatarioId);
    if (consignatario) {
        consignatario.credito = Math.max(0, (consignatario.credito || 0) - venda.creditoConsignatario);
    }
    
    vendas.splice(vendaIndex, 1);
    
    salvarDados();
    renderizarVendas();
    renderizarConsignatarios();
    renderizarDashboard();
    renderizarOpcoesSelects();
    
    mostrarNotificacao("Venda estornada com sucesso!", "sucesso");
}

/* ============================================================
   8. PARCEIRAS (CONSIGNATÁRIOS)
============================================================ */
function adicionarParceira() {
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

    limparFormularioParceira();
    mostrarNotificacao("Parceira adicionada com sucesso!", "sucesso");
}

function limparFormularioParceira() {
    document.getElementById("consignatarioNome").value = "";
    document.getElementById("consignatarioTelefone").value = "";
    document.getElementById("consignatarioCpf").value = "";
    document.getElementById("consignatarioEmail").value = "";
    document.getElementById("consignatarioObservacao").value = "";
    
    const btn = document.querySelector('#parceiras .btn-primary');
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Cadastrar Parceira';
    btn.onclick = function() { adicionarParceira(); };
    document.getElementById("consignatarioIdEdit").value = "";
}

function renderizarConsignatarios() {
    const tbody = document.getElementById("listaparceiras");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtroStatus = document.getElementById("filtroStatusParceira").value;
    const filtroNome = document.getElementById("filtroNomeParceira").value.toLowerCase();

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

function filtrarparceiras() {
    renderizarConsignatarios();
}

function alternarStatusConsignatario(id) {
    const consignatario = consignatarios.find(c => c.id == id);
    if (consignatario) {
        consignatario.status = consignatario.status === 'ativo' ? 'inativo' : 'ativo';
        salvarDados();
        renderizarConsignatarios();
        mostrarNotificacao(`Parceira ${consignatario.status === 'ativo' ? 'ativada' : 'inativada'} com sucesso!`, "sucesso");
    }
}

function editarConsignatario(id) {
    const consignatario = consignatarios.find(c => c.id === id);
    if (!consignatario) return;
    
    document.getElementById("consignatarioIdEdit").value = consignatario.id;
    document.getElementById("consignatarioNome").value = consignatario.nome;
    document.getElementById("consignatarioTelefone").value = consignatario.telefone;
    document.getElementById("consignatarioCpf").value = consignatario.cpf || '';
    document.getElementById("consignatarioEmail").value = consignatario.email || '';
    document.getElementById("consignatarioObservacao").value = consignatario.observacao || '';
    
    const btn = document.querySelector('#parceiras .btn-primary');
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar Parceira';
    btn.onclick = function() { atualizarConsignatario(consignatario.id); };
    
    mostrarNotificacao(`Editando parceira: ${consignatario.nome}`, "info");
}

function atualizarConsignatario(id) {
    const nome = document.getElementById("consignatarioNome").value.trim();
    const telefone = document.getElementById("consignatarioTelefone").value.trim();
    const cpf = document.getElementById("consignatarioCpf").value.trim();
    const email = document.getElementById("consignatarioEmail").value.trim();
    const observacao = document.getElementById("consignatarioObservacao").value.trim();

    if (!nome || !telefone) {
        mostrarNotificacao("Preencha nome e telefone!", "erro");
        return;
    }

    const consignatarioIndex = consignatarios.findIndex(c => c.id === id);
    if (consignatarioIndex !== -1) {
        consignatarios[consignatarioIndex] = {
            ...consignatarios[consignatarioIndex],
            nome,
            telefone,
            cpf,
            email,
            observacao
        };

        salvarDados();
        renderizarConsignatarios();
        renderizarOpcoesSelects();
        
        limparFormularioParceira();
        mostrarNotificacao("Parceira atualizada com sucesso!", "sucesso");
    }
}

/* ============================================================
   9. COMPRADORES
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
    
    const btn = document.querySelector('#compradores .btn-primary');
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Cadastrar Comprador';
    btn.onclick = function() { adicionarComprador(); };
    document.getElementById("compradorIdEdit").value = "";
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

function editarComprador(id) {
    const comprador = compradores.find(c => c.id === id);
    if (!comprador) return;
    
    document.getElementById("compradorIdEdit").value = comprador.id;
    document.getElementById("compradorNome").value = comprador.nome;
    document.getElementById("compradorTelefone").value = comprador.telefone;
    document.getElementById("compradorEmail").value = comprador.email || '';
    document.getElementById("compradorObservacao").value = comprador.obs || '';
    
    const btn = document.querySelector('#compradores .btn-primary');
    btn.innerHTML = '<i class="fas fa-sync-alt"></i> Atualizar Comprador';
    btn.onclick = function() { atualizarComprador(comprador.id); };
    
    mostrarNotificacao(`Editando comprador: ${comprador.nome}`, "info");
}

function atualizarComprador(id) {
    const nome = document.getElementById("compradorNome").value.trim();
    const telefone = document.getElementById("compradorTelefone").value.trim();
    const email = document.getElementById("compradorEmail").value.trim();
    const obs = document.getElementById("compradorObservacao").value.trim();

    if (!nome || !telefone) {
        mostrarNotificacao("Preencha nome e telefone!", "erro");
        return;
    }

    const compradorIndex = compradores.findIndex(c => c.id === id);
    if (compradorIndex !== -1) {
        compradores[compradorIndex] = {
            ...compradores[compradorIndex],
            nome,
            telefone,
            email,
            obs
        };

        salvarDados();
        renderizarCompradores();
        renderizarOpcoesSelects();
        
        limparFormularioComprador();
        mostrarNotificacao("Comprador atualizado com sucesso!", "sucesso");
    }
}

/* ============================================================
   10. CONSUMO DE CRÉDITOS
============================================================ */
function atualizarSaldoConsumo() {
    const consignatarioId = document.getElementById("consumoParceira").value;
    const saldoDiv = document.getElementById("saldoAtualConsumo");
    const btnRegistrar = document.getElementById("btnRegistrarConsumo");
    
    if (!consignatarioId) {
        saldoDiv.innerHTML = "Selecione uma parceira para ver o saldo.";
        saldoDiv.style.backgroundColor = "var(--info)";
        btnRegistrar.disabled = true;
        return;
    }

    const consignatario = consignatarios.find(c => c.id == consignatarioId);
    if (consignatario) {
        const saldo = consignatario.credito || 0;
        saldoDiv.innerHTML = `
            <strong>Saldo Atual:</strong> ${formatarMoeda(saldo)}<br>
            <small>Parceira: ${consignatario.nome}</small>
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
    const consignatarioId = document.getElementById("consumoParceira").value;
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
    const consignatarioId = document.getElementById("consumoParceira").value;
    const valor = parseFloat(document.getElementById("consumoValor").value);
    const data = document.getElementById("consumoData").value;
    const observacao = document.getElementById("consumoObservacao").value.trim();

    if (!consignatarioId || isNaN(valor) || valor <= 0 || !data) {
        mostrarNotificacao("Preencha todos os campos obrigatórios.", "erro");
        return;
    }

    const consignatario = consignatarios.find(c => c.id == consignatarioId);
    if (!consignatario) {
        mostrarNotificacao("Parceira não encontrada.", "erro");
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

    // Atualizar saldo da parceira
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
    document.getElementById("consumoParceira").selectedIndex = 0;
    document.getElementById("consumoValor").value = "";
    document.getElementById("consumoData").value = new Date().toISOString().split('T')[0];
    document.getElementById("consumoObservacao").value = "";
    document.getElementById("saldoAtualConsumo").innerHTML = "Selecione uma parceira para ver o saldo.";
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
            <td>${consignatario ? consignatario.nome : "Parceira não encontrada"}</td>
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
   11. SELECTS GERAIS
============================================================ */
function renderizarOpcoesSelects() {
    // Parceiras para venda
    const sParceiraVenda = document.getElementById("vendaParceiraExistente");
    if (sParceiraVenda) {
        sParceiraVenda.innerHTML = '<option value="">Selecione uma Parceira</option>';
        consignatarios.filter(c => c.status === 'ativo').forEach(c => {
            sParceiraVenda.innerHTML += `<option value="${c.id}">${c.nome} (${formatarMoeda(c.credito || 0)})</option>`;
        });
    }

    // Compradores para venda
    const sCompradorVenda = document.getElementById("vendaCompradorExistente");
    if (sCompradorVenda) {
        sCompradorVenda.innerHTML = '<option value="">Selecione um Comprador</option>';
        compradores.filter(c => c.status === 'ativo').forEach(c => {
            sCompradorVenda.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
        });
    }

    // Desapegos para venda
    const sDesapego = document.getElementById("vendaDesapego");
    if (sDesapego) {
        sDesapego.innerHTML = '<option value="">Selecione o Desapego</option>';
        desapegos.forEach(b => {
            sDesapego.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
        });
    }

    // Parceiras para consumo de créditos
    const sConsigConsumo = document.getElementById("consumoParceira");
    if (sConsigConsumo) {
        sConsigConsumo.innerHTML = '<option value="">Selecione uma Parceira</option>';
        consignatarios.filter(c => c.status === 'ativo' && (c.credito || 0) > 0).forEach(c => {
            sConsigConsumo.innerHTML += `<option value="${c.id}">${c.nome} (Saldo: ${formatarMoeda(c.credito || 0)})</option>`;
        });
    }
}

/* ============================================================
   12. DASHBOARD (ATUALIZADO COM AGUARDANDO PAGAMENTO)
============================================================ */
function popularFiltrosDashboard() {
    const selectMes = document.getElementById("filtroDashboardMes");
    if (selectMes) {
        selectMes.innerHTML = '<option value="">Todos</option>';
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        meses.forEach((mes, index) => {
            selectMes.innerHTML += `<option value="${index + 1}">${mes}</option>`;
        });
    }

    const selectDesapego = document.getElementById("filtroDashboardDesapego");
    if (selectDesapego) {
        selectDesapego.innerHTML = '<option value="">Todos</option>';
        desapegos.forEach(desapego => {
            selectDesapego.innerHTML += `<option value="${desapego.id}">${desapego.nome}</option>`;
        });
    }

    const selectParceira = document.getElementById("filtroDashboardParceira");
    if (selectParceira) {
        selectParceira.innerHTML = '<option value="">Todos</option>';
        consignatarios.forEach(consignatario => {
            selectParceira.innerHTML += `<option value="${consignatario.id}">${consignatario.nome}</option>`;
        });
    }
}

function aplicarFiltroDashboard() {
    const mes = document.getElementById("filtroDashboardMes").value;
    const desapegoId = document.getElementById("filtroDashboardDesapego").value;
    const parceiraId = document.getElementById("filtroDashboardParceira").value;

    let vendasFiltradas = vendas;

    if (mes) {
        vendasFiltradas = vendasFiltradas.filter(v => {
            const dataVenda = new Date(v.dataVenda);
            return (dataVenda.getMonth() + 1) === parseInt(mes);
        });
    }

    if (desapegoId) {
        vendasFiltradas = vendasFiltradas.filter(v => v.desapegoId == desapegoId);
    }

    if (parceiraId) {
        vendasFiltradas = vendasFiltradas.filter(v => v.consignatarioId == parceiraId);
    }

    atualizarDashboardComFiltros(vendasFiltradas);
}

function atualizarDashboardComFiltros(vendasFiltradas) {
    const totalVendasFiltrado = vendasFiltradas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalCreditosFiltrado = vendasFiltradas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    const totalComissaoFiltrado = vendasFiltradas.reduce((acc, v) => acc + v.comissaoLoja, 0);

    document.getElementById("totalVendas").textContent = formatarMoeda(totalVendasFiltrado);
    document.getElementById("totalCreditos").textContent = formatarMoeda(totalCreditosFiltrado);
    document.getElementById("totalComissao").textContent = formatarMoeda(totalComissaoFiltrado);
    document.getElementById("totalItensVendidos").textContent = vendasFiltradas.length;

    const progressVendas = document.getElementById("progressVendas");
    const metaVendas = 10000;
    const percentualVendas = Math.min((totalVendasFiltrado / metaVendas) * 100, 100);
    progressVendas.style.width = `${percentualVendas}%`;

    renderizarTopParceirasComFiltros(vendasFiltradas);
}

function renderizarTopParceirasComFiltros(vendasFiltradas) {
    const tbody = document.getElementById("topClientes");
    if (!tbody) return;

    tbody.innerHTML = "";

    const parceirasComVendas = consignatarios.map(c => {
        const vendasCons = vendasFiltradas.filter(v => v.consignatarioId == c.id);
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

    parceirasComVendas.forEach((c, index) => {
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

    if (parceirasComVendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma venda encontrada com os filtros aplicados</td></tr>';
    }
}

function resetarFiltrosDashboard() {
    document.getElementById("filtroDashboardMes").value = "";
    document.getElementById("filtroDashboardDesapego").value = "";
    document.getElementById("filtroDashboardParceira").value = "";
    
    renderizarDashboard();
}

function renderizarDashboard() {
    // 1. POPULAR FILTROS
    popularFiltrosDashboard();

    // Métricas básicas
    const totalItens = itens.length;
    const itensVendidos = itens.filter(i => i.status === "vendido").length;
    const totalVendas = vendas.length;
    const totalArrecadado = vendas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
    const totalCreditos = vendas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    const creditosAtivos = consignatarios.reduce((acc, c) => acc + (c.credito || 0), 0);
    
    // Calcular aguardando pagamento
    const totalAguardando = atualizarDashboardAguardandoPagamento();

    // Atualizar cards
    document.getElementById("totalVendas").textContent = formatarMoeda(totalArrecadado);
    document.getElementById("totalCreditos").textContent = formatarMoeda(totalCreditos);
    document.getElementById("creditosAtivos").textContent = formatarMoeda(creditosAtivos);
    document.getElementById("totalComissao").textContent = formatarMoeda(totalComissao);
    document.getElementById("totalItensVendidos").textContent = itensVendidos;

    // Progresso de vendas
    const progressVendas = document.getElementById("progressVendas");
    const metaVendas = 10000;
    const percentualVendas = Math.min((totalArrecadado / metaVendas) * 100, 100);
    progressVendas.style.width = `${percentualVendas}%`;

    // Top parceiras
    renderizarTopParceiras();

    // Lembretes
    renderizarLembretes();
}

function renderizarTopParceiras() {
    const tbody = document.getElementById("topClientes");
    if (!tbody) return;

    tbody.innerHTML = "";

    const parceirasComVendas = consignatarios.map(c => {
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

    parceirasComVendas.forEach((c, index) => {
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

    if (parceirasComVendas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhuma venda registrada ainda</td></tr>';
    }
}

function renderizarLembretes() {
    const lista = document.getElementById("lista-lembretes");
    if (!lista) return;

    lista.innerHTML = "";

    // Lembrete de desapego não selecionado
    if (!desapegoAtual) {
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Nenhum Desapego Selecionado</strong>
                <p>Selecione um desapego para começar a gerenciar vendas.</p>
            </div>
            <div class="acoes">
                <button onclick="abrirTab('desapegos')" class="btn btn-primary btn-sm">
                    <i class="fas fa-calendar-alt"></i> Gerenciar Desapegos
                </button>
            </div>
        `;
        lista.appendChild(lembrete);
    }

    // Lembrete de créditos disponíveis
    const parceirasComCredito = consignatarios.filter(c => (c.credito || 0) > 0);
    if (parceirasComCredito.length > 0) {
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Créditos Disponíveis</strong>
                <p>${parceirasComCredito.length} parceira(s) com créditos para uso.</p>
            </div>
            <div class="acoes">
                <button onclick="abrirTab('consumoCreditos')" class="btn btn-info btn-sm">
                    <i class="fas fa-credit-card"></i> Usar Créditos
                </button>
            </div>
        `;
        lista.appendChild(lembrete);
    }

    // Lembrete de vendas aguardando pagamento
    const vendasPendentes = vendas.filter(v => v.statusPagamento === 'pendente');
    if (vendasPendentes.length > 0) {
        const totalPendente = vendasPendentes.reduce((acc, v) => acc + v.precoVenda, 0);
        const lembrete = document.createElement("div");
        lembrete.className = "lembrete-item";
        lembrete.innerHTML = `
            <div class="info">
                <strong>Vendas Aguardando Pagamento</strong>
                <p>${vendasPendentes.length} venda(s) pendente(s) - Total: R$ ${totalPendente.toFixed(2)}</p>
            </div>
            <div class="acoes">
                <button onclick="abrirTab('vendas')" class="btn btn-warning btn-sm">
                    <i class="fas fa-clock"></i> Ver Vendas
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
   13. CONFIGURAÇÕES
============================================================ */
function salvarConfiguracoes() {
    const pctCons = parseFloat(document.getElementById("percentualParceira").value);
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
    document.getElementById("percentualParceira").value = configuracoes.percentualConsignatario;
    document.getElementById("percentualLoja").value = configuracoes.percentualLoja;
    document.getElementById("validadeCredito").value = configuracoes.validadeCredito;
    document.getElementById("alertaEstoque").value = configuracoes.alertaEstoque;
}

/* ============================================================
   14. EXPORTAR / IMPORTAR DADOS
============================================================ */
function exportarDados() {
    const dados = {
        itens,
        vendas,
        desapegos,
        consignatarios,
        compradores,
        consumosCreditos,
        configuracoes,
        desapegoAtual,
        dataExportacao: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `desapegoplus_backup_${new Date().toISOString().split('T')[0]}.json`;
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
                desapegos = dados.desapegos || [];
                consignatarios = dados.consignatarios || [];
                compradores = dados.compradores || [];
                consumosCreditos = dados.consumosCreditos || [];
                configuracoes = dados.configuracoes || configuracoes;
                desapegoAtual = dados.desapegoAtual || null;

                salvarDados();
                init();
                mostrarNotificacao("Dados importados com sucesso!", "sucesso");
            }

        } catch (erro) {
            mostrarNotificacao("Arquivo inválido ou corrompido!", "erro");
        }
    };

    reader.readAsText(file);
    event.target.value = "";
}

function atualizarInfoBackup() {
    const ultimoBackupElement = document.getElementById("ultimoBackup");
    if (ultimoBackupElement) {
        const dados = localStorage.getItem("desapegoplus_db");
        if (dados) {
            ultimoBackupElement.textContent = "Dados locais presentes";
        } else {
            ultimoBackupElement.textContent = "Nenhum";
        }
    }
}

/* ============================================================
   15. RELATÓRIOS PDF PADRONIZADOS (INCLUINDO AGUARDANDO PAGAMENTO)
============================================================ */

function gerarRelatorioVendasPorDesapegoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    const anoAtual = new Date().getFullYear();
    
    // Cabeçalho
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DETALHADO DE VENDAS POR DESAPEGO", 148, 15, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema DesapegoPlus - Gerado em: ${dataHoraGeracao}`, 20, 35);
    doc.text(`Ano de referência: ${anoAtual}`, 250, 35);
    
    // Totais gerais
    const totalGeralVendas = vendas.reduce((acc, v) => acc + v.precoVenda, 0);
    const totalGeralComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
    const totalGeralCreditos = vendas.reduce((acc, v) => acc + v.creditoConsignatario, 0);
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total em Vendas: ${formatarMoeda(totalGeralVendas)}`, 20, 56);
    doc.text(`Comissão da Loja: ${formatarMoeda(totalGeralComissao)}`, 20, 62);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalGeralCreditos)}`, 20, 68);
    doc.text(`Desapegos Ativos: ${desapegos.filter(b => b.status === 'ativo').length}`, 120, 56);
    doc.text(`Parceiras: ${consignatarios.filter(c => c.status === 'ativo').length}`, 120, 62);
    doc.text(`Itens Vendidos: ${itens.filter(i => i.status === 'vendido').length}`, 120, 68);
    doc.text(`Ticket Médio: ${formatarMoeda(totalGeralVendas / vendas.length)}`, 220, 56);
    doc.text(`Maior Venda: ${formatarMoeda(Math.max(...vendas.map(v => v.precoVenda)))}`, 220, 62);
    doc.text(`Menor Venda: ${formatarMoeda(Math.min(...vendas.map(v => v.precoVenda)))}`, 220, 68);
    
    let y = 80;
    
    // Agrupar vendas por desapego
    const vendasPorDesapego = {};
    desapegos.forEach(desapego => {
        const vendasDesapego = vendas.filter(v => v.desapegoId === desapego.id);
        if (vendasDesapego.length > 0) {
            vendasPorDesapego[desapego.nome] = {
                desapego: desapego,
                vendas: vendasDesapego,
                total: vendasDesapego.reduce((acc, v) => acc + v.precoVenda, 0),
                comissao: vendasDesapego.reduce((acc, v) => acc + v.comissaoLoja, 0),
                creditos: vendasDesapego.reduce((acc, v) => acc + v.creditoConsignatario, 0),
                qtdVendas: vendasDesapego.length
            };
        }
    });
    
    // Ordenar desapegos por total de vendas (decrescente)
    const desapegosOrdenados = Object.keys(vendasPorDesapego).sort((a, b) => 
        vendasPorDesapego[b].total - vendasPorDesapego[a].total
    );
    
    desapegosOrdenados.forEach((nomeDesapego, index) => {
        const dadosDesapego = vendasPorDesapego[nomeDesapego];
        
        // Verificar se precisa de nova página
        if (y > 180) {
            doc.addPage();
            y = 20;
        }
        
        // Cabeçalho do desapego
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 257, 12, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${nomeDesapego}`, 22, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Data: ${formatarData(dadosDesapego.desapego.inicio)}`, 180, y + 8);
        doc.text(`Total: ${formatarMoeda(dadosDesapego.total)}`, 220, y + 8);
        doc.text(`Vendas: ${dadosDesapego.qtdVendas}`, 260, y + 8);
        
        y += 15;
        
        // Tabela de vendas do desapego
        const linhasVendas = dadosDesapego.vendas.map(v => {
            const item = itens.find(i => i.id === v.itemId);
            const comprador = compradores.find(c => c.id === v.compradorId);
            const consignatario = consignatarios.find(c => c.id === v.consignatarioId);
            
            return [
                formatarData(v.dataVenda),
                item ? item.descricao.substring(0, 25) + (item.descricao.length > 25 ? '...' : '') : "-",
                comprador ? comprador.nome.substring(0, 18) : "-",
                consignatario ? consignatario.nome.substring(0, 18) : "-",
                v.pagamento,
                formatarMoeda(v.precoVenda),
                formatarMoeda(v.creditoConsignatario),
                formatarMoeda(v.comissaoLoja)
            ];
        });
        
        doc.autoTable({
            head: [["Data", "Item", "Comprador", "Parceira", "Pagamento", "Valor", "Crédito", "Comissão"]],
            body: linhasVendas,
            startY: y,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { 
                fillColor: [100, 100, 100], 
                textColor: 255, 
                fontSize: 7,
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            tableLineWidth: 0.1,
            tableLineColor: [200, 200, 200]
        });
        
        y = doc.lastAutoTable.finalY + 8;
        
        // Resumo do desapego
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMO DO DESAPEGO:", 22, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Vendido: ${formatarMoeda(dadosDesapego.total)}`, 80, y);
        doc.text(`Comissão Loja: ${formatarMoeda(dadosDesapego.comissao)}`, 130, y);
        doc.text(`Créditos Gerados: ${formatarMoeda(dadosDesapego.creditos)}`, 180, y);
        doc.text(`Ticket Médio: ${formatarMoeda(dadosDesapego.total / dadosDesapego.qtdVendas)}`, 230, y);
        doc.text(`Vendas: ${dadosDesapego.qtdVendas}`, 280, y);
        
        y += 12;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 277, y);
        y += 5;
    });
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
        doc.text("Sistema DesapegoPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    doc.save("relatorio_vendas_desapego_detalhado.pdf");
    mostrarNotificacao("Relatório de vendas por desapego gerado com sucesso!", "sucesso");
}

function gerarRelatorioVendasPorParceiraPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    const anoAtual = new Date().getFullYear();
    
    // Cabeçalho
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DETALHADO DE VENDAS POR PARCEIRA", 148, 15, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema DesapegoPlus - Gerado em: ${dataHoraGeracao}`, 20, 35);
    doc.text(`Ano de referência: ${anoAtual}`, 250, 35);
    
    // Preparar dados das parceiras
    const dadosParceiras = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
        const itensCons = itens.filter(i => i.consignatarioId === c.id);
        const itensVendidos = itensCons.filter(i => i.status === "vendido");
        const totalVendido = vendasCons.reduce((acc, v) => acc + v.precoVenda, 0);
        const totalCreditos = vendasCons.reduce((acc, v) => acc + v.creditoConsignatario, 0);
        const totalComissao = vendasCons.reduce((acc, v) => acc + v.comissaoLoja, 0);
        const consumos = consumosCreditos.filter(cons => cons.consignatarioId === c.id);
        const totalConsumido = consumos.reduce((acc, cons) => acc + cons.valor, 0);
        
        return {
            ...c,
            vendas: vendasCons,
            qtdVendas: vendasCons.length,
            itensCadastrados: itensCons.length,
            itensVendidos: itensVendidos.length,
            totalVendido,
            totalCreditos,
            totalComissao,
            totalConsumido,
            saldoAtual: c.credito || 0,
            taxaConversao: itensCons.length > 0 ? (itensVendidos.length / itensCons.length * 100).toFixed(1) + '%' : '0%',
            ticketMedio: vendasCons.length > 0 ? totalVendido / vendasCons.length : 0
        };
    }).filter(c => c.qtdVendas > 0)
      .sort((a, b) => b.totalVendido - a.totalVendido);
    
    // Totais gerais
    const totalGeralVendas = dadosParceiras.reduce((acc, c) => acc + c.totalVendido, 0);
    const totalGeralCreditos = dadosParceiras.reduce((acc, c) => acc + c.totalCreditos, 0);
    const totalGeralComissao = dadosParceiras.reduce((acc, c) => acc + c.totalComissao, 0);
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total em Vendas: ${formatarMoeda(totalGeralVendas)}`, 20, 56);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalGeralCreditos)}`, 20, 62);
    doc.text(`Comissão da Loja: ${formatarMoeda(totalGeralComissao)}`, 20, 68);
    doc.text(`Parceiras com Vendas: ${dadosParceiras.length}`, 120, 56);
    doc.text(`Melhor Parceira: ${dadosParceiras[0] ? dadosParceiras[0].nome : 'N/A'}`, 120, 62);
    doc.text(`Ticket Médio Geral: ${formatarMoeda(totalGeralVendas / vendas.length)}`, 120, 68);
    doc.text(`Vendas Totais: ${vendas.length}`, 220, 56);
    doc.text(`Maior Venda: ${formatarMoeda(Math.max(...vendas.map(v => v.precoVenda)))}`, 220, 62);
    doc.text(`Menor Venda: ${formatarMoeda(Math.min(...vendas.map(v => v.precoVenda)))}`, 220, 68);
    
    let y = 80;
    
    dadosParceiras.forEach((parceira, index) => {
        // Verificar se precisa de nova página
        if (y > 170) {
            doc.addPage();
            y = 20;
        }
        
        // Cabeçalho da parceira
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 257, 12, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${parceira.nome}`, 22, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Telefone: ${parceira.telefone}`, 180, y + 8);
        doc.text(`Total: ${formatarMoeda(parceira.totalVendido)}`, 220, y + 8);
        doc.text(`Vendas: ${parceira.qtdVendas}`, 260, y + 8);
        
        y += 15;
        
        // Tabela de vendas da parceira
        const linhasVendas = parceira.vendas.map(v => {
            const item = itens.find(i => i.id === v.itemId);
            const comprador = compradores.find(c => c.id === v.compradorId);
            const desapego = desapegos.find(d => d.id === v.desapegoId);
            
            return [
                formatarData(v.dataVenda),
                item ? item.descricao.substring(0, 25) + (item.descricao.length > 25 ? '...' : '') : "-",
                comprador ? comprador.nome.substring(0, 18) : "-",
                desapego ? desapego.nome.substring(0, 20) : "-",
                v.pagamento,
                formatarMoeda(v.precoVenda),
                formatarMoeda(v.creditoConsignatario),
                formatarMoeda(v.comissaoLoja)
            ];
        });
        
        doc.autoTable({
            head: [["Data", "Item", "Comprador", "Desapego", "Pagamento", "Valor", "Crédito", "Comissão"]],
            body: linhasVendas,
            startY: y,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { 
                fillColor: [100, 100, 100], 
                textColor: 255, 
                fontSize: 7,
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            tableLineWidth: 0.1,
            tableLineColor: [200, 200, 200]
        });
        
        y = doc.lastAutoTable.finalY + 8;
        
        // Resumo da parceira
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMO DA PARCEIRA:", 22, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Vendido: ${formatarMoeda(parceira.totalVendido)}`, 80, y);
        doc.text(`Créditos Gerados: ${formatarMoeda(parceira.totalCreditos)}`, 130, y);
        doc.text(`Créditos Usados: ${formatarMoeda(parceira.totalConsumido)}`, 180, y);
        doc.text(`Saldo Atual: ${formatarMoeda(parceira.saldoAtual)}`, 230, y);
        doc.text(`Ticket Médio: ${formatarMoeda(parceira.ticketMedio)}`, 280, y);
        
        y += 8;
        
        doc.text(`Comissão Loja: ${formatarMoeda(parceira.totalComissao)}`, 80, y);
        doc.text(`Itens Vendidos: ${parceira.itensVendidos}`, 130, y);
        doc.text(`Taxa Conversão: ${parceira.taxaConversao}`, 180, y);
        doc.text(`Status: ${parceira.status}`, 230, y);
        
        y += 12;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 277, y);
        y += 5;
    });
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
        doc.text("Sistema DesapegoPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    doc.save("relatorio_vendas_parceiras_detalhado.pdf");
    mostrarNotificacao("Relatório de vendas por parceira gerado com sucesso!", "sucesso");
}

function gerarRelatorioVendasPorMesPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    const anoAtual = new Date().getFullYear();
    
    // Cabeçalho
    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`RELATÓRIO DETALHADO DE VENDAS POR MÊS - ${anoAtual}`, 148, 15, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema DesapegoPlus - Gerado em: ${dataHoraGeracao}`, 20, 35);
    
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
                creditos: 0,
                qtdVendas: 0
            };
        }
        vendasPorMes[mes].vendas.push(v);
        vendasPorMes[mes].total += v.precoVenda;
        vendasPorMes[mes].comissao += v.comissaoLoja;
        vendasPorMes[mes].creditos += v.creditoConsignatario;
        vendasPorMes[mes].qtdVendas++;
    });
    
    // Preparar dados para tabela
    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const linhasResumo = [];
    let totalAno = 0;
    let totalComissaoAno = 0;
    let totalCreditosAno = 0;
    let totalVendasAno = 0;
    
    meses.forEach((mesNome, mesIndex) => {
        const dadosMes = vendasPorMes[mesIndex] || { vendas: [], total: 0, comissao: 0, creditos: 0, qtdVendas: 0 };
        linhasResumo.push([
            mesNome,
            dadosMes.qtdVendas.toString(),
            formatarMoeda(dadosMes.total),
            formatarMoeda(dadosMes.comissao),
            formatarMoeda(dadosMes.creditos),
            dadosMes.qtdVendas > 0 ? formatarMoeda(dadosMes.total / dadosMes.qtdVendas) : formatarMoeda(0)
        ]);
        
        totalAno += dadosMes.total;
        totalComissaoAno += dadosMes.comissao;
        totalCreditosAno += dadosMes.creditos;
        totalVendasAno += dadosMes.qtdVendas;
    });
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO DO ANO", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total do Ano: ${formatarMoeda(totalAno)}`, 20, 56);
    doc.text(`Comissão do Ano: ${formatarMoeda(totalComissaoAno)}`, 20, 62);
    doc.text(`Créditos do Ano: ${formatarMoeda(totalCreditosAno)}`, 20, 68);
    doc.text(`Vendas no Ano: ${totalVendasAno}`, 120, 56);
    
    const mesMaisVendas = Object.keys(vendasPorMes).length > 0
        ? meses[Object.keys(vendasPorMes).reduce((a, b) => vendasPorMes[a].qtdVendas > vendasPorMes[b].qtdVendas ? a : b)]
        : 'N/A';
    
    const mesMaiorFaturamento = Object.keys(vendasPorMes).length > 0
        ? meses[Object.keys(vendasPorMes).reduce((a, b) => vendasPorMes[a].total > vendasPorMes[b].total ? a : b)]
        : 'N/A';
    
    doc.text(`Mês com Mais Vendas: ${mesMaisVendas}`, 120, 62);
    doc.text(`Mês Maior Faturamento: ${mesMaiorFaturamento}`, 120, 68);
    doc.text(`Ticket Médio Anual: ${formatarMoeda(totalAno / totalVendasAno)}`, 220, 56);
    doc.text(`Maior Venda: ${formatarMoeda(Math.max(...vendas.map(v => v.precoVenda)))}`, 220, 62);
    doc.text(`Menor Venda: ${formatarMoeda(Math.min(...vendas.map(v => v.precoVenda)))}`, 220, 68);
    
    let y = 80;
    
    // Tabela de resumo mensal
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("VISÃO GERAL MENSAL", 20, y);
    y += 8;
    
    doc.autoTable({
        head: [["Mês", "Qtd Vendas", "Total Vendido", "Comissão Loja", "Créditos Gerados", "Ticket Médio"]],
        body: linhasResumo,
        startY: y,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { 
            fillColor: [100, 100, 100], 
            textColor: 255, 
            fontSize: 9,
            fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: function(data) {
            if (data.pageNumber === 1) {
                y = data.cursor.y + 15;
                adicionarDetalhesMensais();
            }
        }
    });
    
    function adicionarDetalhesMensais() {
        meses.forEach((mesNome, mesIndex) => {
            const dadosMes = vendasPorMes[mesIndex];
            if (!dadosMes || dadosMes.qtdVendas === 0) return;
            
            // Verificar se precisa de nova página
            if (y > 170) {
                doc.addPage();
                y = 20;
            }
            
            // Cabeçalho do mês
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y, 257, 12, 'F');
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(`MÊS: ${mesNome.toUpperCase()}`, 22, y + 8);
            
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Total: ${formatarMoeda(dadosMes.total)}`, 180, y + 8);
            doc.text(`Vendas: ${dadosMes.qtdVendas}`, 220, y + 8);
            doc.text(`Ticket: ${formatarMoeda(dadosMes.total / dadosMes.qtdVendas)}`, 260, y + 8);
            
            y += 15;
            
            // Tabela de vendas do mês
            const linhasVendas = dadosMes.vendas.map(v => {
                const item = itens.find(i => i.id === v.itemId);
                const comprador = compradores.find(c => c.id === v.compradorId);
                const consignatario = consignatarios.find(c => c.id === v.consignatarioId);
                const desapego = desapegos.find(d => d.id === v.desapegoId);
                
                return [
                    new Date(v.dataVenda).getDate().toString().padStart(2, '0'),
                    item ? item.descricao.substring(0, 22) + (item.descricao.length > 22 ? '...' : '') : "-",
                    comprador ? comprador.nome.substring(0, 16) : "-",
                    consignatario ? consignatario.nome.substring(0, 16) : "-",
                    desapego ? desapego.nome.substring(0, 15) : "-",
                    v.pagamento,
                    formatarMoeda(v.precoVenda),
                    formatarMoeda(v.creditoConsignatario)
                ];
            });
            
            doc.autoTable({
                head: [["Dia", "Item", "Comprador", "Parceira", "Desapego", "Pagamento", "Valor", "Crédito"]],
                body: linhasVendas,
                startY: y,
                margin: { left: 20, right: 20 },
                styles: { fontSize: 7, cellPadding: 1.5 },
                headStyles: { 
                    fillColor: [100, 100, 100], 
                    textColor: 255, 
                    fontSize: 7,
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                tableLineWidth: 0.1,
                tableLineColor: [200, 200, 200]
            });
            
            y = doc.lastAutoTable.finalY + 8;
            
            // Resumo do mês
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.text("RESUMO DO MÊS:", 22, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Total Vendido: ${formatarMoeda(dadosMes.total)}`, 80, y);
            doc.text(`Comissão Loja: ${formatarMoeda(dadosMes.comissao)}`, 130, y);
            doc.text(`Créditos Gerados: ${formatarMoeda(dadosMes.creditos)}`, 180, y);
            doc.text(`Vendas: ${dadosMes.qtdVendas}`, 230, y);
            doc.text(`Ticket Médio: ${formatarMoeda(dadosMes.total / dadosMes.qtdVendas)}`, 280, y);
            
            y += 12;
            
            // Linha separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(20, y, 277, y);
            y += 5;
        });
    }
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
        doc.text("Sistema DesapegoPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    doc.save(`relatorio_vendas_mensal_detalhado_${anoAtual}.pdf`);
    mostrarNotificacao("Relatório de vendas por mês gerado com sucesso!", "sucesso");
}

function gerarRelatorioCreditosPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    
    // Cabeçalho
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DETALHADO DE SALDOS DE CRÉDITOS", 148, 15, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema DesapegoPlus - Gerado em: ${dataHoraGeracao}`, 20, 35);
    
    // Preparar dados
    const dadosParceiras = consignatarios.map(c => {
        const vendasCons = vendas.filter(v => v.consignatarioId === c.id);
        const itensVendidos = itens.filter(i => i.consignatarioId === c.id && i.status === "vendido");
        const consumos = consumosCreditos.filter(cons => cons.consignatarioId === c.id);
        const totalConsumido = consumos.reduce((acc, cons) => acc + cons.valor, 0);
        const totalCreditosGerados = vendasCons.reduce((acc, v) => acc + v.creditoConsignatario, 0);
        
        return {
            ...c,
            vendas: vendasCons,
            qtdVendas: vendasCons.length,
            itensVendidos: itensVendidos.length,
            totalCreditosGerados,
            totalConsumido,
            saldoAtual: c.credito || 0,
            consumos: consumos,
            taxaUso: totalCreditosGerados > 0 ? ((totalConsumido / totalCreditosGerados) * 100).toFixed(1) + '%' : '0%',
            ultimoConsumo: consumos.length > 0 ? 
                new Date(Math.max(...consumos.map(c => new Date(c.data)))) : null
        };
    }).sort((a, b) => b.saldoAtual - a.saldoAtual);
    
    // Totais gerais
    const totalSaldos = dadosParceiras.reduce((acc, c) => acc + c.saldoAtual, 0);
    const totalCreditosGerados = dadosParceiras.reduce((acc, c) => acc + c.totalCreditosGerados, 0);
    const totalConsumido = dadosParceiras.reduce((acc, c) => acc + c.totalConsumido, 0);
    const parceirasComSaldo = dadosParceiras.filter(c => c.saldoAtual > 0).length;
    
    // Resumo executivo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO DE CRÉDITOS", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Saldo Total em Créditos: ${formatarMoeda(totalSaldos)}`, 20, 56);
    doc.text(`Créditos Gerados: ${formatarMoeda(totalCreditosGerados)}`, 20, 62);
    doc.text(`Créditos Consumidos: ${formatarMoeda(totalConsumido)}`, 20, 68);
    doc.text(`Parceiras com Saldo: ${parceirasComSaldo}`, 120, 56);
    doc.text(`Maior Saldo: ${formatarMoeda(Math.max(...dadosParceiras.map(c => c.saldoAtual)))}`, 120, 62);
    doc.text(`Taxa de Uso Geral: ${totalCreditosGerados > 0 ? ((totalConsumido / totalCreditosGerados) * 100).toFixed(1) + '%' : '0%'}`, 120, 68);
    doc.text(`Parceiras Ativas: ${dadosParceiras.filter(c => c.status === 'ativo').length}`, 220, 56);
    doc.text(`Parceiras com Consumo: ${dadosParceiras.filter(c => c.totalConsumido > 0).length}`, 220, 62);
    doc.text(`Valor Médio Crédito: ${formatarMoeda(totalCreditosGerados / dadosParceiras.filter(c => c.totalCreditosGerados > 0).length)}`, 220, 68);
    
    let y = 80;
    
    dadosParceiras.forEach((parceira, index) => {
        // Verificar se precisa de nova página
        if (y > 170) {
            doc.addPage();
            y = 20;
        }
        
        // Cabeçalho da parceira
        const corFundo = parceira.saldoAtual > 0 ? [240, 240, 240] : [255, 230, 230];
        doc.setFillColor(...corFundo);
        doc.rect(20, y, 257, 12, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${parceira.nome}`, 22, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Saldo: ${formatarMoeda(parceira.saldoAtual)}`, 180, y + 8);
        doc.text(`Créditos Gerados: ${formatarMoeda(parceira.totalCreditosGerados)}`, 220, y + 8);
        doc.text(`Status: ${parceira.status}`, 260, y + 8);
        
        y += 15;
        
        // Tabela de consumos da parceira
        if (parceira.consumos.length > 0) {
            const linhasConsumos = parceira.consumos.map(cons => {
                return [
                    formatarData(cons.data),
                    formatarMoeda(cons.valor),
                    formatarMoeda(cons.saldoAnterior),
                    formatarMoeda(cons.saldoAnterior - cons.valor),
                    cons.observacao || '-'
                ];
            });
            
            doc.autoTable({
                head: [["Data", "Valor Consumido", "Saldo Anterior", "Saldo Posterior", "Observação"]],
                body: linhasConsumos,
                startY: y,
                margin: { left: 20, right: 20 },
                styles: { fontSize: 7, cellPadding: 1.5 },
                headStyles: { 
                    fillColor: [100, 100, 100], 
                    textColor: 255, 
                    fontSize: 7,
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                tableLineWidth: 0.1,
                tableLineColor: [200, 200, 200]
            });
            
            y = doc.lastAutoTable.finalY + 8;
        } else {
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text("Nenhum consumo registrado", 22, y);
            y += 12;
        }
        
        // Resumo da parceira
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("RESUMO FINANCEIRO:", 22, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Saldo Atual: ${formatarMoeda(parceira.saldoAtual)}`, 80, y);
        doc.text(`Créditos Gerados: ${formatarMoeda(parceira.totalCreditosGerados)}`, 130, y);
        doc.text(`Créditos Usados: ${formatarMoeda(parceira.totalConsumido)}`, 180, y);
        doc.text(`Taxa de Uso: ${parceira.taxaUso}`, 230, y);
        
        y += 8;
        
        doc.text(`Vendas Realizadas: ${parceira.qtdVendas}`, 80, y);
        doc.text(`Itens Vendidos: ${parceira.itensVendidos}`, 130, y);
        doc.text(`Último Consumo: ${parceira.ultimoConsumo ? formatarData(parceira.ultimoConsumo) : "Nunca"}`, 180, y);
        doc.text(`Telefone: ${parceira.telefone}`, 230, y);
        
        y += 12;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 277, y);
        y += 5;
    });
    
    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
        doc.text("Sistema DesapegoPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    doc.save("relatorio_saldos_creditos_detalhado.pdf");
    mostrarNotificacao("Relatório de saldos de créditos gerado com sucesso!", "sucesso");
}

/* ============================================================
   16. RELATÓRIO DE AGUARDANDO PAGAMENTO (NOVO)
============================================================ */
function gerarRelatorioAguardandoPagamentoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape");
    
    const dataHoraGeracao = new Date().toLocaleString("pt-BR");
    
    // Cabeçalho
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, 297, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE VENDAS AGUARDANDO PAGAMENTO", 148, 15, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Sistema DesapegoPlus - Gerado em: ${dataHoraGeracao}`, 20, 35);
    
    // Filtrar vendas aguardando pagamento
    const vendasPendentes = vendas.filter(v => 
        v.statusPagamento === 'pendente'
    );
    
    if (vendasPendentes.length === 0) {
        doc.setFontSize(14);
        doc.text("Nenhuma venda aguardando pagamento no momento.", 20, 60);
        
        doc.save("relatorio_aguardando_pagamento_vazio.pdf");
        mostrarNotificacao("Não há vendas aguardando pagamento!", "info");
        return;
    }
    
    // Resumo executivo
    const totalPendente = vendasPendentes.reduce((acc, v) => acc + v.precoVenda, 0);
    const qtdVendas = vendasPendentes.length;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO EXECUTIVO", 20, 48);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Pendente: ${formatarMoeda(totalPendente)}`, 20, 56);
    doc.text(`Quantidade de Vendas: ${qtdVendas}`, 20, 62);
    doc.text(`Ticket Médio Pendente: ${formatarMoeda(totalPendente / qtdVendas)}`, 20, 68);
    doc.text(`Venda Mais Alta: ${formatarMoeda(Math.max(...vendasPendentes.map(v => v.precoVenda)))}`, 120, 56);
    doc.text(`Venda Mais Baixa: ${formatarMoeda(Math.min(...vendasPendentes.map(v => v.precoVenda)))}`, 120, 62);
    doc.text(`Percentual do Total: ${((totalPendente / vendas.reduce((acc, v) => acc + v.precoVenda, 0)) * 100).toFixed(1)}%`, 120, 68);
    
    let y = 80;
    
    // Agrupar por comprador
    const compradoresPendentes = {};
    
    vendasPendentes.forEach(venda => {
        const comprador = compradores.find(c => c.id == venda.compradorId);
        const compradorNome = comprador ? comprador.nome : "Comprador não encontrado";
        
        if (!compradoresPendentes[compradorNome]) {
            compradoresPendentes[compradorNome] = {
                vendas: [],
                total: 0,
                telefone: comprador ? comprador.telefone : "Não informado"
            };
        }
        
        compradoresPendentes[compradorNome].vendas.push(venda);
        compradoresPendentes[compradorNome].total += venda.precoVenda;
    });
    
    // Ordenar compradores pelo total pendente (decrescente)
    const compradoresOrdenados = Object.keys(compradoresPendentes).sort((a, b) => 
        compradoresPendentes[b].total - compradoresPendentes[a].total
    );
    
    compradoresOrdenados.forEach((nomeComprador, index) => {
        const dadosComprador = compradoresPendentes[nomeComprador];
        
        // Verificar se precisa de nova página
        if (y > 180) {
            doc.addPage();
            y = 20;
        }
        
        // Cabeçalho do comprador
        doc.setFillColor(240, 240, 240);
        doc.rect(20, y, 257, 12, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${nomeComprador}`, 22, y + 8);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Telefone: ${dadosComprador.telefone}`, 180, y + 8);
        doc.text(`Total Pendente: ${formatarMoeda(dadosComprador.total)}`, 220, y + 8);
        doc.text(`Vendas: ${dadosComprador.vendas.length}`, 260, y + 8);
        
        y += 15;
        
        // Tabela de vendas do comprador
        const linhasVendas = dadosComprador.vendas.map(v => {
            const item = itens.find(i => i.id === v.itemId);
            const consignatario = consignatarios.find(c => c.id === v.consignatarioId);
            const desapego = desapegos.find(d => d.id === v.desapegoId);
            
            return [
                formatarData(v.dataVenda),
                item ? item.descricao.substring(0, 25) + (item.descricao.length > 25 ? '...' : '') : "-",
                consignatario ? consignatario.nome.substring(0, 20) : "-",
                desapego ? desapego.nome.substring(0, 20) : "-",
                v.pagamento,
                formatarMoeda(v.precoVenda),
                "Pendente"
            ];
        });
        
        doc.autoTable({
            head: [["Data", "Item", "Parceira", "Desapego", "Pagamento", "Valor", "Status"]],
            body: linhasVendas,
            startY: y,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 7, cellPadding: 1.5 },
            headStyles: { 
                fillColor: [100, 100, 100], 
                textColor: 255, 
                fontSize: 7,
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            tableLineWidth: 0.1,
            tableLineColor: [200, 200, 200]
        });
        
        y = doc.lastAutoTable.finalY + 8;
        
        // Resumo do comprador
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMO:", 22, y);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Pendente: ${formatarMoeda(dadosComprador.total)}`, 80, y);
        doc.text(`Quantidade de Vendas: ${dadosComprador.vendas.length}`, 130, y);
        doc.text(`Ticket Médio: ${formatarMoeda(dadosComprador.total / dadosComprador.vendas.length)}`, 180, y);
        doc.text(`Última Venda: ${formatarData(dadosComprador.vendas[dadosComprador.vendas.length - 1].dataVenda)}`, 230, y);
        
        y += 12;
        
        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 277, y);
        y += 5;
    });
    
    // Página de resumo geral
    doc.addPage();
    
    // Gráfico de distribuição (simulado)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DISTRIBUIÇÃO POR COMPRADOR", 20, 30);
    
    let yResumo = 50;
    let xResumo = 20;
    
    compradoresOrdenados.forEach((nomeComprador, index) => {
        const dadosComprador = compradoresPendentes[nomeComprador];
        const percentual = (dadosComprador.total / totalPendente) * 100;
        
        // Barra horizontal
        const larguraBarra = (percentual / 100) * 250;
        doc.setFillColor(139, 92, 246);
        doc.rect(xResumo, yResumo, larguraBarra, 8, 'F');
        
        // Texto
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.text(`${nomeComprador.substring(0, 15)}... - ${formatarMoeda(dadosComprador.total)} (${percentual.toFixed(1)}%)`, 
                xResumo + 5, yResumo + 6);
        
        yResumo += 12;
        
        if (yResumo > 180 && index < compradoresOrdenados.length - 1) {
            doc.addPage();
            yResumo = 30;
        }
    });
    
    // Recomendações
    yResumo += 20;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("RECOMENDAÇÕES PARA AÇÃO:", 20, yResumo);
    
    yResumo += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("1. Priorize o contato com os compradores com maior valor pendente", 20, yResumo);
    yResumo += 8;
    doc.text("2. Estabeleça prazos claros para pagamento", 20, yResumo);
    yResumo += 8;
    doc.text("3. Ofereça facilidades de pagamento (Parcelamento, PIX, etc.)", 20, yResumo);
    yResumo += 8;
    doc.text("4. Mantenha registro de todos os contatos realizados", 20, yResumo);
    yResumo += 8;
    doc.text("5. Considere políticas de desconto para pagamento antecipado", 20, yResumo);
    
    // Rodapé em todas as páginas
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${pageCount}`, 148, 205, { align: "center" });
        doc.text("Sistema DesapegoPlus - Relatórios Gerenciais", 280, 205, { align: "right" });
    }
    
    doc.save(`relatorio_aguardando_pagamento_${new Date().toISOString().slice(0,10)}.pdf`);
    mostrarNotificacao("Relatório de vendas aguardando pagamento gerado com sucesso!", "sucesso");
}

/* ============================================================
   17. FUNÇÕES GERAIS DO SISTEMA
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
        } else if (aba === 'desapegos') {
            renderizarDesapegos();
        } else if (aba === 'vendas') {
            renderizarVendas();
            renderizarOpcoesSelects();
        } else if (aba === 'parceiras') {
            renderizarConsignatarios();
        } else if (aba === 'compradores') {
            renderizarCompradores();
        } else if (aba === 'consumoCreditos') {
            renderizarConsumosCreditos();
            renderizarOpcoesSelects();
        } else if (aba === 'configuracoes') {
            carregarConfiguracoes();
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
    localStorage.setItem('desapegoplus_theme', newTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    
    mostrarNotificacao(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, "sucesso");
}

function carregarTema() {
    const savedTheme = localStorage.getItem('desapegoplus_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}
/* ============================================================
   18. DADOS DE EXEMPLO
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
    desapegos = [];
    consignatarios = [];
    compradores = [];
    consumosCreditos = [];
    desapegoAtual = null;
    
    // Configurações padrão
    configuracoes = {
        percentualConsignatario: 80,
        percentualLoja: 20,
        alertaEstoque: 5,
        validadeCredito: 6
    };
    
    // Criar 5 parceiras de exemplo
    const parceirasExemplo = [
        { id: gerarId(), nome: "Parceira EX-1 - Maria Silva", telefone: "(11) 11111-1111", email: "maria@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "Parceira EX-2 - João Santos", telefone: "(11) 22222-2222", email: "joao@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "Parceira EX-3 - Ana Oliveira", telefone: "(11) 33333-3333", email: "ana@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "Parceira EX-4 - Carla Lima", telefone: "(11) 44444-4444", email: "carla@exemplo.com", credito: 0, status: "ativo" },
        { id: gerarId(), nome: "Parceira EX-5 - Pedro Costa", telefone: "(11) 55555-5555", email: "pedro@exemplo.com", credito: 0, status: "ativo" }
    ];
    
    consignatarios = parceirasExemplo;
    
    // Criar 5 compradores de exemplo
    const compradoresExemplo = [
        { id: gerarId(), nome: "Comprador EX-1 - Carlos Mendes", telefone: "(11) 66666-6666", email: "carlos@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "Comprador EX-2 - Fernanda Rocha", telefone: "(11) 77777-7777", email: "fernanda@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "Comprador EX-3 - Rafael Alves", telefone: "(11) 88888-8888", email: "rafael@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "Comprador EX-4 - Juliana Martins", telefone: "(11) 99999-9999", email: "juliana@exemplo.com", status: "ativo" },
        { id: gerarId(), nome: "Comprador EX-5 - Bruno Souza", telefone: "(11) 10101-0101", email: "bruno@exemplo.com", status: "ativo" }
    ];
    
    compradores = compradoresExemplo;
    
    // Criar desapegos de exemplo
    const hoje = new Date();
    const desapego1Id = gerarId();
    const desapegosExemplo = [
        { 
            id: desapego1Id, 
            nome: "Desapego de Verão 2024", 
            inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0],
            tema: "Roupas de Verão",
            observacao: "Primeiro desapego do ano com foco em roupas leves",
            status: "ativo"
        },
        { 
            id: gerarId(), 
            nome: "Desapego de Inverno 2024", 
            inicio: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15).toISOString().split('T')[0],
            tema: "Roupas de Frio",
            observacao: "Desapego de roupas de inverno e agasalhos",
            status: "ativo"
        }
    ];
    
    desapegos = desapegosExemplo;
    desapegoAtual = desapego1Id;
    
    // Dados para gerar vendas variadas
    const produtos = [
        // Roupas
        { descricao: "Vestido Floral Verão", categoria: "roupa", preco: 89.90, tamanho: "M", marca: "Zara", estado: "novo" },
        { descricao: "Blusa Básica Algodão", categoria: "roupa", preco: 45.00, tamanho: "P", marca: "Renner", estado: "seminovo" },
        { descricao: "Calça Jeans Skinny", categoria: "roupa", preco: 79.90, tamanho: "38", marca: "Levi's", estado: "usado" },
        { descricao: "Short Jeans Destroyed", categoria: "roupa", preco: 65.00, tamanho: "36", marca: "Forever 21", estado: "seminovo" },
        { descricao: "Camiseta Básica Branca", categoria: "roupa", preco: 35.00, tamanho: "G", marca: "H&M", estado: "novo" },
        { descricao: "Saia Midi Plissada", categoria: "roupa", preco: 120.00, tamanho: "M", marca: "Shein", estado: "novo" },
        { descricao: "Blazer Slim Fit", categoria: "roupa", preco: 150.00, tamanho: "40", marca: "Reserva", estado: "seminovo" },
        
        // Acessórios
        { descricao: "Bolsa de Couro Preta", categoria: "bolsa", preco: 180.00, tamanho: "M", marca: "Animale", estado: "seminovo" },
        { descricao: "Cinto de Couro Marrom", categoria: "acessorio", preco: 45.00, tamanho: "P", marca: "Colcci", estado: "usado" },
        { descricao: "Óculos de Sol Vintage", categoria: "acessorio", preco: 75.00, tamanho: "Único", marca: "Ray-Ban", estado: "seminovo" },
        
        // Calçados
        { descricao: "Tênis Casual Branco", categoria: "calcado", preco: 120.00, tamanho: "38", marca: "Nike", estado: "seminovo" },
        { descricao: "Sandália Rasteira", categoria: "calcado", preco: 55.00, tamanho: "36", marca: "Arezzo", estado: "usado" },
        { descricao: "Sapato Social Preto", categoria: "calcado", preco: 130.00, tamanho: "41", marca: "Diesel", estado: "novo" },
        
        // Outros
        { descricao: "Vestido Longo Festa", categoria: "roupa", preco: 200.00, tamanho: "G", marca: "Farm", estado: "novo" },
        { descricao: "Jaqueta Jeans", categoria: "roupa", preco: 95.00, tamanho: "M", marca: "Guess", estado: "seminovo" },
        { descricao: "Bolsa Tote Grande", categoria: "bolsa", preco: 110.00, tamanho: "G", marca: "Louis Vuitton", estado: "usado" }
    ];
    
    const formasPagamento = ["dinheiro", "pix", "cartao", "link", "Aguardando Pagamento"];
    
    // Gerar 30 vendas
    const vendasExemplo = [];
    const itensExemplo = [];
    
    for (let i = 0; i < 30; i++) {
        const produto = produtos[Math.floor(Math.random() * produtos.length)];
        const parceira = consignatarios[Math.floor(Math.random() * consignatarios.length)];
        const comprador = compradores[Math.floor(Math.random() * compradores.length)];
        const desapego = desapegos[Math.floor(Math.random() * desapegos.length)];
        const formaPagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
        
        // Gerar data aleatória nos últimos 3 meses
        const dataVenda = new Date();
        dataVenda.setDate(dataVenda.getDate() - Math.floor(Math.random() * 90));
        
        // Criar item
        const itemId = gerarId();
        const item = {
            id: itemId,
            descricao: produto.descricao,
            categoria: produto.categoria,
            preco: produto.preco,
            tamanho: produto.tamanho,
            marca: produto.marca,
            estado: produto.estado,
            consignatarioId: parceira.id,
            observacao: `Item ${i + 1} - ${produto.estado}`,
            desapegoId: desapego.id,
            status: "vendido",
            dataCadastro: dataVenda.toISOString()
        };
        
        itensExemplo.push(item);
        
        // Calcular créditos e comissão
        const creditoParceira = produto.preco * (configuracoes.percentualConsignatario / 100);
        const comissaoLoja = produto.preco * (configuracoes.percentualLoja / 100);
        
        // Determinar status de pagamento
        const statusPagamento = formaPagamento === 'Aguardando Pagamento' ? 'pendente' : 'pago';
        
        // Criar venda
        const venda = {
            id: gerarId(),
            itemId: itemId,
            precoVenda: produto.preco,
            dataVenda: dataVenda.toISOString().split('T')[0],
            compradorId: comprador.id,
            desapegoId: desapego.id,
            pagamento: formaPagamento,
            creditoConsignatario: statusPagamento === 'pendente' ? 0 : creditoParceira,
            comissaoLoja: statusPagamento === 'pendente' ? 0 : comissaoLoja,
            consignatarioId: parceira.id,
            statusPagamento: statusPagamento
        };
        
        vendasExemplo.push(venda);
        
        // Atualizar créditos da parceira apenas se pago
        if (statusPagamento === 'pago') {
            const parceiraIndex = consignatarios.findIndex(c => c.id === parceira.id);
            if (parceiraIndex !== -1) {
                consignatarios[parceiraIndex].credito = (consignatarios[parceiraIndex].credito || 0) + creditoParceira;
            }
        }
    }
    
    itens = itensExemplo;
    vendas = vendasExemplo;
    
    salvarDados();
    
    // Atualizar a interface
    init();
    
    mostrarNotificacao("✅ 30 vendas de exemplo carregadas com sucesso! (5 parceiras × 5 compradores)", "sucesso");
    
    // Abrir o dashboard para mostrar os dados
    abrirTab('dashboard');
}

/* ============================================================
   18. INICIALIZAÇÃO FINAL
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
