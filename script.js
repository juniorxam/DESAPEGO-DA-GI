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

        function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
            const area = document.getElementById('notification-area');
            if (!area) return; 

            const notif = document.createElement('div');
            notif.className = `notification ${tipo}`;
            notif.innerHTML = `<strong>${mensagem}</strong>`;
            area.appendChild(notif);

            setTimeout(() => {
                notif.classList.add('hide');
                notif.addEventListener('transitionend', () => notif.remove());
            }, duracao);
        }

        // =========================================
        // ARMAZENAMENTO DE DADOS (localStorage)
        // =========================================
        function salvarDados() {
            localStorage.setItem('bazares', JSON.stringify(bazares));
            localStorage.setItem('itens', JSON.stringify(itens));
            localStorage.setItem('clientes', JSON.stringify(clientes));
            localStorage.setItem('compradores', JSON.stringify(compradores));
            localStorage.setItem('vendas', JSON.stringify(vendas));
            localStorage.setItem('consumos', JSON.stringify(consumos));
            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
            
            // Renderiza o que for visível
            renderizarTodasTabelas();
            renderizarDashboard();
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
            
            // Aplicar tema
            document.documentElement.setAttribute('data-theme', configuracoes.tema);

            renderizarTodasTabelas();
            renderizarDashboard();
        }
        
        function renderizarTodasTabelas() {
            renderizarBazares();
            renderizarItens();
            renderizarConsignatarios();
            renderizarCompradores();
            renderizarVendas();
            renderizarConsumos();
            popularFiltrosDashboard();
            popularSelectsRelatorio(); // NOVO: Para popular a aba Relatórios
            preencherCamposConfiguracao();
        }

        function checkInitializers() {
            // Pode ser usado para notificações iniciais
        }

        function limparTudo(confirmar = true) {
            if (confirmar && !confirm('ATENÇÃO: Você tem certeza que deseja apagar TODOS os dados do sistema? Esta ação é irreversível.')) {
                return;
            }
            bazares = [];
            itens = [];
            clientes = [];
            compradores = [];
            vendas = [];
            consumos = [];
            localStorage.clear();
            mostrarNotificacao('Todos os dados foram apagados. Recarregando a página...', 'aviso');
            
            setTimeout(() => {
                location.reload(); 
            }, 100);
        }

        function carregarDadosDeExemplo() {
            if (!confirm('Esta ação limpará todos os dados existentes e carregará 20 exemplos de vendas e estoque. Continuar?')) {
                return;
            }
            limparTudo(false); 

            // 1. DADOS DE CONSIGNATÁRIOS
            const nomesConsignatarios = ['Ana Silva', 'Bruno Lima', 'Carla Mendes', 'David Costa', 'Elaine Fernandes'];
            const novosClientes = nomesConsignatarios.map((nome, index) => ({
                id: index + 1,
                nome,
                telefone: `(99) 99999-${1000 + index}`,
                email: `${nome.toLowerCase().replace(' ', '.')}@email.com`,
                creditos: 0.00
            }));
            clientes = novosClientes;

            // 2. DADOS DE COMPRADORES
            const nomesCompradores = ['Felipe Gomes', 'Gabriela Alves', 'Henrique Souza', 'Isabela Rocha', 'João Pereira'];
            const novosCompradores = nomesCompradores.map((nome, index) => ({
                id: index + 1,
                nome,
                telefone: `(99) 88888-${1000 + index}`,
                totalCompras: 0.00
            }));
            compradores = novosCompradores;
            
            // 3. DADOS DE BAZARES
            bazares = [
                { id: 1, nome: 'Bazar Verão 2025', dataInicio: '2025-01-10', dataFim: '2025-01-20' },
                { id: 2, nome: 'Bazar Outono 2025', dataInicio: '2025-04-05', dataFim: null },
                { id: 3, nome: 'Bazar Inverno 2025', dataInicio: '2025-07-01', dataFim: '2025-07-15' },
            ];

            // 4. ITENS INICIAIS (BASE PARA VENDAS E ALGUNS DISPONÍVEIS)
            const descricoesItens = [
                'Vestido Floral Longo', 'Calça Jeans Skinny', 'Blusa de Seda', 'Jaqueta de Couro', 'Bolsa Tiracolo',
                'Sapato Social Masculino', 'Tênis Esportivo', 'Óculos de Sol', 'Cinto de Couro', 'Brinco de Prata'
            ];
            
            const novosItens = descricoesItens.map((desc, index) => ({
                id: index + 1,
                descricao: desc,
                consignatarioId: (index % clientes.length) + 1,
                valor: parseFloat((Math.random() * 200 + 50).toFixed(2)),
                quantidade: 0, // Inicia em 0
                bazarId: (index % bazares.length) + 1,
                status: 'Vendido' // status inicial
            }));
            
            novosItens.push(
                { id: 11, descricao: 'Camiseta Básica P', consignatarioId: 2, valor: 45.00, quantidade: 3, bazarId: 2, status: 'Disponível' },
                { id: 12, descricao: 'Porta Retratos Grande', consignatarioId: 5, valor: 90.00, quantidade: 1, bazarId: 2, status: 'Disponível' }
            );
            itens = novosItens;

            // 5. REGISTRO DE 20 VENDAS ALEATÓRIAS
            for (let i = 0; i < 20; i++) {
                const itemId = (i % descricoesItens.length) + 1; 
                const itemBase = itens.find(item => item.id === itemId);
                if (!itemBase) continue; 

                const valorVenda = parseFloat((itemBase.valor * (Math.random() * 0.2 + 0.9)).toFixed(2));
                const consignatario = clientes.find(c => c.id === itemBase.consignatarioId);
                const comprador = compradores[(i % compradores.length)];
                
                const percentualConsignatario = configuracoes.percentualConsignatario / 100;
                const creditoGerado = valorVenda * percentualConsignatario;
                
                itemBase.quantidade = 0; 
                itemBase.status = 'Vendido'; 
                
                consignatario.creditos = (consignatario.creditos || 0) + creditoGerado;
                comprador.totalCompras = (comprador.totalCompras || 0) + valorVenda;

                const dateOffset = Math.floor(Math.random() * 60); 
                const date = new Date();
                date.setDate(date.getDate() - dateOffset);
                const dataVenda = date.toISOString().split('T')[0];

                vendas.push({
                    id: i + 1,
                    itemId: itemId,
                    compradorId: comprador.id,
                    bazarVendaId: itemBase.bazarId,
                    valorVenda,
                    creditoGerado,
                    comissaoLoja: valorVenda - creditoGerado,
                    dataVenda,
                    formaPagamento: ['PIX', 'Cartao', 'Dinheiro'][(i % 3)]
                });
            }
            
            // 6. REGISTRO DE CONSUMOS 
            const anaSilva = clientes.find(c => c.id === 1); 
            if (anaSilva && anaSilva.creditos > 50) {
                 consumos.push({
                    id: 1,
                    consignatarioId: 1, 
                    valor: 50.00,
                    data: obterDataHojeISO(),
                    descricao: 'Retirada de crédito em dinheiro (Teste)'
                });
                anaSilva.creditos = Math.max(0, anaSilva.creditos - 50.00);
            }

            localStorage.setItem('bazares', JSON.stringify(bazares));
            localStorage.setItem('itens', JSON.stringify(itens));
            localStorage.setItem('clientes', JSON.stringify(clientes)); 
            localStorage.setItem('compradores', JSON.stringify(compradores)); 
            localStorage.setItem('vendas', JSON.stringify(vendas));
            localStorage.setItem('consumos', JSON.stringify(consumos)); 
            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
            
            mostrarNotificacao('Dados de exemplo carregados! Recarregando a página...', 'sucesso');
            
            setTimeout(() => {
                location.reload(); 
            }, 100);
        }

        // =========================================
        // NAVEGAÇÃO (CORRIGIDO E ATUALIZADO)
        // =========================================
        function showTab(tabId) {
            // Remove a classe 'active' de todos os conteúdos de aba
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            // Remove a classe 'active' de todos os botões de aba
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });

            // Adiciona 'active' ao conteúdo da aba selecionada (com checagem de null)
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }

            // Adiciona 'active' ao botão da aba selecionada (com checagem de null)
            const tabButton = document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`);
            if (tabButton) {
                tabButton.classList.add('active');
            }
            
            // Renderiza o conteúdo específico da aba
            if (tabId === 'dashboard') {
                renderizarDashboard();
            } else if (tabId === 'relatorios') { // NOVO: Para popular a aba Relatórios
                 popularSelectsRelatorio();
            } else {
                renderizarTodasTabelas();
            }
        }
        
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            configuracoes.tema = newTheme;
            salvarConfiguracoes(); 
            
            const icon = document.querySelector('.theme-toggle i');
            if(icon) {
                 icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
           
            if (document.getElementById('dashboard')?.classList.contains('active')) {
                renderizarDashboard();
            }
        }


        // =========================================
        // GESTÃO DE BAZARES
        // =========================================
        function criarBazar() {
            const nome = document.getElementById('bazarNome')?.value.trim();
            const inicio = document.getElementById('bazarInicio')?.value;
            const fim = document.getElementById('bazarFim')?.value;

            if (!nome || !inicio) {
                mostrarNotificacao('Preencha o nome e a data de início do bazar.', 'erro');
                return;
            }

            const novoBazar = {
                id: gerarId(bazares),
                nome: nome,
                dataInicio: inicio,
                dataFim: fim || null
            };

            bazares.push(novoBazar);
            salvarDados();
            document.getElementById('formBazar')?.reset();
            mostrarNotificacao(`Bazar "${nome}" criado com sucesso!`, 'sucesso');
        }

        function editarBazar(id) {
            const bazar = bazares.find(b => b.id === id);
            if (!bazar) return;

            document.getElementById('bazarNome').value = bazar.nome;
            document.getElementById('bazarInicio').value = bazar.dataInicio;
            document.getElementById('bazarFim').value = bazar.dataFim || '';

            document.getElementById('bazarSalvar').innerText = 'Salvar Edição';
            document.getElementById('bazarSalvar').onclick = () => salvarEdicaoBazar(id);
        }

        function salvarEdicaoBazar(id) {
            const bazar = bazares.find(b => b.id === id);
            if (!bazar) return;

            bazar.nome = document.getElementById('bazarNome').value.trim();
            bazar.dataInicio = document.getElementById('bazarInicio').value;
            bazar.dataFim = document.getElementById('bazarFim').value || null;

            salvarDados();
            document.getElementById('formBazar')?.reset();
            document.getElementById('bazarSalvar').innerText = 'Criar Bazar';
            document.getElementById('bazarSalvar').onclick = criarBazar;
            mostrarNotificacao(`Bazar "${bazar.nome}" atualizado com sucesso!`, 'sucesso');
        }

        function excluirBazar(id) {
            if (!confirm('Tem certeza que deseja excluir este bazar? Itens e vendas ligadas a ele não serão apagadas, mas perderão a referência.')) {
                return;
            }
            bazares = bazares.filter(b => b.id !== id);
            salvarDados();
            mostrarNotificacao('Bazar excluído!', 'aviso');
        }

        function renderizarBazares() {
            const tbody = document.getElementById('tabelaBazaresBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = bazares.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio)).map(b => {
                const dataFim = b.dataFim ? new Date(b.dataFim).toLocaleDateString() : 'Aberto';
                const status = b.dataFim && new Date(b.dataFim) < new Date() ? 'Encerrado' : 'Ativo';
                const statusClass = status === 'Encerrado' ? 'badge-danger' : 'badge-success';

                return `
                    <tr>
                        <td>${b.id}</td>
                        <td>${b.nome}</td>
                        <td>${new Date(b.dataInicio).toLocaleDateString()}</td>
                        <td>${dataFim}</td>
                        <td><span class="badge ${statusClass}">${status}</span></td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="editarBazar(${b.id})" class="btn btn-warning btn-sm" title="Editar"><i class="fas fa-edit"></i></button>
                                <button onclick="excluirBazar(${b.id})" class="btn btn-danger btn-sm" title="Excluir"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }

        // =========================================
        // GESTÃO DE CONSIGNATÁRIOS (Clientes Donos de Itens)
        // =========================================
        function adicionarConsignatario() {
            const nome = document.getElementById('consignatarioNome')?.value.trim();
            const telefone = document.getElementById('consignatarioTelefone')?.value.trim();
            const email = document.getElementById('consignatarioEmail')?.value.trim();

            if (!nome) {
                mostrarNotificacao('O nome do consignatário é obrigatório.', 'erro');
                return;
            }

            const novoConsignatario = {
                id: gerarId(clientes),
                nome: nome,
                telefone: telefone,
                email: email,
                creditos: 0.00
            };

            clientes.push(novoConsignatario);
            salvarDados();
            document.getElementById('formConsignatario')?.reset();
            mostrarNotificacao(`Consignatário "${nome}" adicionado com sucesso!`, 'sucesso');
        }
        
        function editarConsignatario(id) {
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) return;

            document.getElementById('consignatarioNome').value = cliente.nome;
            document.getElementById('consignatarioTelefone').value = cliente.telefone;
            document.getElementById('consignatarioEmail').value = cliente.email;

            document.getElementById('consignatarioSalvar').innerText = 'Salvar Edição';
            document.getElementById('consignatarioSalvar').onclick = () => salvarEdicaoConsignatario(id);
        }

        function salvarEdicaoConsignatario(id) {
            const cliente = clientes.find(c => c.id === id);
            if (!cliente) return;

            cliente.nome = document.getElementById('consignatarioNome').value.trim();
            cliente.telefone = document.getElementById('consignatarioTelefone').value.trim();
            cliente.email = document.getElementById('consignatarioEmail').value.trim();

            salvarDados();
            document.getElementById('formConsignatario')?.reset();
            document.getElementById('consignatarioSalvar').innerText = 'Adicionar Consignatário';
            document.getElementById('consignatarioSalvar').onclick = adicionarConsignatario;
            mostrarNotificacao(`Consignatário "${cliente.nome}" atualizado com sucesso!`, 'sucesso');
        }

        function excluirConsignatario(id) {
            const temItens = itens.some(i => i.consignatarioId === id && i.status !== 'Vendido');
            const temCreditos = clientes.find(c => c.id === id)?.creditos > 0;
            
            if (temItens || temCreditos) {
                mostrarNotificacao('Não é possível excluir: o consignatário tem itens em estoque ou crédito pendente.', 'erro');
                return;
            }

            if (!confirm('Tem certeza que deseja excluir este consignatário?')) {
                return;
            }
            clientes = clientes.filter(c => c.id !== id);
            itens.filter(i => i.consignatarioId === id).forEach(i => i.consignatarioId = null); 
            salvarDados();
            mostrarNotificacao('Consignatário excluído!', 'aviso');
        }


        function renderizarConsignatarios() {
            const tbody = document.getElementById('tabelaConsignatariosBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = clientes.sort((a, b) => b.creditos - a.creditos).map(c => {
                const totalVendas = vendas.filter(v => {
                    const item = itens.find(i => i.id === v.itemId);
                    return item && item.consignatarioId === c.id;
                }).length;

                return `
                    <tr>
                        <td>${c.id}</td>
                        <td data-label="Nome">${c.nome}</td>
                        <td data-label="Crédito" class="text-right ${c.creditos > 0 ? 'text-success font-weight-bold' : ''}">${formatarMoeda(c.creditos)}</td>
                        <td data-label="Total Vendas">${totalVendas}</td>
                        <td data-label="Telefone">${c.telefone}</td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="gerarRelatorioConsignatarioPDF(${c.id})" class="btn btn-info btn-sm" title="Gerar Relatório PDF">
                                    <i class="fas fa-file-pdf"></i>
                                </button>
                                <button onclick="editarConsignatario(${c.id})" class="btn btn-warning btn-sm" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="excluirConsignatario(${c.id})" class="btn btn-danger btn-sm" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }


        // =========================================
        // GESTÃO DE COMPRADORES (Clientes que Compram)
        // =========================================
        function adicionarComprador() {
            const nome = document.getElementById('compradorNome')?.value.trim();
            const telefone = document.getElementById('compradorTelefone')?.value.trim();

            if (!nome) {
                mostrarNotificacao('O nome do comprador é obrigatório.', 'erro');
                return;
            }

            const novoComprador = {
                id: gerarId(compradores),
                nome: nome,
                telefone: telefone,
                totalCompras: 0.00
            };

            compradores.push(novoComprador);
            salvarDados();
            document.getElementById('formComprador')?.reset();
            mostrarNotificacao(`Comprador "${nome}" adicionado com sucesso!`, 'sucesso');
        }

        function editarComprador(id) {
            const comprador = compradores.find(c => c.id === id);
            if (!comprador) return;

            document.getElementById('compradorNome').value = comprador.nome;
            document.getElementById('compradorTelefone').value = comprador.telefone;

            document.getElementById('compradorSalvar').innerText = 'Salvar Edição';
            document.getElementById('compradorSalvar').onclick = () => salvarEdicaoComprador(id);
        }

        function salvarEdicaoComprador(id) {
            const comprador = compradores.find(c => c.id === id);
            if (!comprador) return;

            comprador.nome = document.getElementById('compradorNome').value.trim();
            comprador.telefone = document.getElementById('compradorTelefone').value.trim();

            salvarDados();
            document.getElementById('formComprador')?.reset();
            document.getElementById('compradorSalvar').innerText = 'Adicionar Comprador';
            document.getElementById('compradorSalvar').onclick = adicionarComprador;
            mostrarNotificacao(`Comprador "${comprador.nome}" atualizado com sucesso!`, 'sucesso');
        }

        function excluirComprador(id) {
            const temVendas = vendas.some(v => v.compradorId === id);
            
            if (temVendas) {
                mostrarNotificacao('Não é possível excluir: o comprador possui vendas registradas.', 'erro');
                return;
            }

            if (!confirm('Tem certeza que deseja excluir este comprador?')) {
                return;
            }
            compradores = compradores.filter(c => c.id !== id);
            salvarDados();
            mostrarNotificacao('Comprador excluído!', 'aviso');
        }

        function renderizarCompradores() {
            const tbody = document.getElementById('tabelaCompradoresBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = compradores.sort((a, b) => b.totalCompras - a.totalCompras).map(c => {
                const totalVendas = vendas.filter(v => v.compradorId === c.id).length;
                return `
                    <tr>
                        <td>${c.id}</td>
                        <td data-label="Nome">${c.nome}</td>
                        <td data-label="Total Compras" class="text-right">${formatarMoeda(c.totalCompras)}</td>
                        <td data-label="Qtd Compras">${totalVendas}</td>
                        <td data-label="Telefone">${c.telefone}</td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="editarComprador(${c.id})" class="btn btn-warning btn-sm" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="excluirComprador(${c.id})" class="btn btn-danger btn-sm" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }


        // =========================================
        // GESTÃO DE ITENS
        // =========================================
        function popularSelectsItens() {
            const selectConsignatario = document.getElementById('itemConsignatarioId');
            const selectBazar = document.getElementById('itemBazarId');
            
            if (!selectConsignatario || !selectBazar) {
                return; 
            }

            [selectConsignatario, selectBazar].forEach(select => select.innerHTML = '<option value="">Selecione...</option>');

            clientes.forEach(c => {
                selectConsignatario.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });

            bazares.forEach(b => {
                selectBazar.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
            });
        }

        function adicionarItem() {
            const descricao = document.getElementById('itemDescricao')?.value.trim();
            const consignatarioId = parseInt(document.getElementById('itemConsignatarioId')?.value);
            const valor = parseFloat(document.getElementById('itemValor')?.value);
            const quantidade = parseInt(document.getElementById('itemQuantidade')?.value);
            const bazarId = parseInt(document.getElementById('itemBazarId')?.value);

            if (!descricao || !consignatarioId || isNaN(valor) || isNaN(quantidade) || !bazarId) {
                mostrarNotificacao('Preencha todos os campos obrigatórios (Descrição, Consignatário, Valor, Quantidade e Bazar).', 'erro');
                return;
            }

            const novoItem = {
                id: gerarId(itens),
                descricao: descricao,
                consignatarioId: consignatarioId,
                valor: valor,
                quantidade: quantidade,
                bazarId: bazarId,
                status: 'Disponível'
            };

            itens.push(novoItem);
            salvarDados();
            document.getElementById('formItem')?.reset();
            mostrarNotificacao(`Item "${descricao}" adicionado com ${quantidade} unidade(s)!`, 'sucesso');
        }
        
        function editarItem(id) {
            const item = itens.find(i => i.id === id);
            if (!item) return;
            
            popularSelectsItens(); 

            document.getElementById('itemDescricao').value = item.descricao;
            document.getElementById('itemConsignatarioId').value = item.consignatarioId;
            document.getElementById('itemValor').value = item.valor;
            document.getElementById('itemQuantidade').value = item.quantidade;
            document.getElementById('itemBazarId').value = item.bazarId;
            
            document.getElementById('itemSalvar').innerText = 'Salvar Edição';
            document.getElementById('itemSalvar').onclick = () => salvarEdicaoItem(id);
        }

        function salvarEdicaoItem(id) {
            const item = itens.find(i => i.id === id);
            if (!item) return;

            const descricao = document.getElementById('itemDescricao').value.trim();
            const consignatarioId = parseInt(document.getElementById('itemConsignatarioId').value);
            const valor = parseFloat(document.getElementById('itemValor').value);
            const quantidade = parseInt(document.getElementById('itemQuantidade').value);
            const bazarId = parseInt(document.getElementById('itemBazarId').value);
            
            if (!descricao || !consignatarioId || isNaN(valor) || isNaN(quantidade) || !bazarId) {
                mostrarNotificacao('Preencha todos os campos obrigatórios.', 'erro');
                return;
            }

            item.descricao = descricao;
            item.consignatarioId = consignatarioId;
            item.valor = valor;
            item.quantidade = quantidade;
            item.bazarId = bazarId;
            
            if (item.quantidade > 0 && item.status === 'Vendido') {
                 item.status = 'Disponível';
            }

            salvarDados();
            document.getElementById('formItem')?.reset();
            document.getElementById('itemSalvar').innerText = 'Adicionar Item';
            document.getElementById('itemSalvar').onclick = adicionarItem;
            mostrarNotificacao(`Item "${item.descricao}" atualizado com sucesso!`, 'sucesso');
        }

        function excluirItem(id) {
            const temVendas = vendas.some(v => v.itemId === id);
            
            if (temVendas) {
                mostrarNotificacao('Não é possível excluir: o item possui vendas registradas. Considere apenas zerar o estoque.', 'erro');
                return;
            }

            if (!confirm('Tem certeza que deseja excluir este item?')) {
                return;
            }
            itens = itens.filter(i => i.id !== id);
            salvarDados();
            mostrarNotificacao('Item excluído!', 'aviso');
        }

        function renderizarItens() {
            popularSelectsItens();
            const tbody = document.getElementById('tabelaItensBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = itens.sort((a, b) => b.id - a.id).map(i => {
                const consignatario = clientes.find(c => c.id === i.consignatarioId);
                const bazar = bazares.find(b => b.id === i.bazarId);
                
                let statusClass = 'badge-success';
                let statusTexto = i.status;
                if (i.quantidade === 0 && i.status !== 'Vendido') {
                    statusClass = 'badge-danger';
                    statusTexto = 'Esgotado';
                } else if (i.quantidade <= configuracoes.alertaEstoque) {
                    statusClass = 'badge-warning';
                    statusTexto = 'Baixo';
                } else if (i.status === 'Vendido') {
                     statusClass = 'badge-primary';
                }

                return `
                    <tr>
                        <td>${i.id}</td>
                        <td data-label="Descrição">${i.descricao}</td>
                        <td data-label="Consignatário">${consignatario ? consignatario.nome : 'N/A'}</td>
                        <td data-label="Valor" class="text-right">${formatarMoeda(i.valor)}</td>
                        <td data-label="Qtd" class="text-center">${i.quantidade}</td>
                        <td data-label="Bazar">${bazar ? bazar.nome : 'N/A'}</td>
                        <td data-label="Status"><span class="badge ${statusClass}">${statusTexto}</span></td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="editarItem(${i.id})" class="btn btn-warning btn-sm" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="excluirItem(${i.id})" class="btn btn-danger btn-sm" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }
        
        
        // =========================================
        // GESTÃO DE VENDAS
        // =========================================
        function popularSelectsVenda() {
            const selectItem = document.getElementById('vendaItemId');
            const selectComprador = document.getElementById('vendaCompradorId');
            
            if (!selectItem || !selectComprador) {
                return;
            }

            const itensDisponiveis = itens.filter(i => i.quantidade > 0 && i.status !== 'Vendido');
            
            selectItem.innerHTML = '<option value="">Selecione o Item...</option>';
            itensDisponiveis.forEach(i => {
                const consignatario = clientes.find(c => c.id === i.consignatarioId);
                selectItem.innerHTML += `<option value="${i.id}" data-valor="${i.valor}">${i.descricao} (${consignatario ? consignatario.nome : 'N/A'}) - ${formatarMoeda(i.valor)}</option>`;
            });
            
            selectComprador.innerHTML = '<option value="">Selecione o Comprador...</option>';
            compradores.forEach(c => {
                selectComprador.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
            
            const vendaData = document.getElementById('vendaData');
            if (vendaData) {
                 vendaData.value = obterDataHojeISO();
            }
        }

        function atualizarValorVenda() {
            const selectItem = document.getElementById('vendaItemId');
            const valorInput = document.getElementById('vendaValor');
            
            if (!selectItem || !valorInput) return;

            const selectedOption = selectItem.options[selectItem.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.valor) {
                const valorOriginal = parseFloat(selectedOption.dataset.valor);
                valorInput.value = valorOriginal.toFixed(2);
            } else {
                 valorInput.value = '';
            }
        }

        function registrarVenda() {
            const itemId = parseInt(document.getElementById('vendaItemId')?.value);
            const compradorId = parseInt(document.getElementById('vendaCompradorId')?.value);
            const valorVenda = parseFloat(document.getElementById('vendaValor')?.value);
            const formaPagamento = document.getElementById('vendaPagamento')?.value;
            const dataVenda = document.getElementById('vendaData')?.value;
            
            if (!itemId || !compradorId || isNaN(valorVenda) || !formaPagamento || !dataVenda) {
                mostrarNotificacao('Preencha todos os campos da venda.', 'erro');
                return;
            }
            
            const item = itens.find(i => i.id === itemId);
            const consignatario = clientes.find(c => c.id === item?.consignatarioId);
            const comprador = compradores.find(c => c.id === compradorId);

            if (!item || item.quantidade <= 0) {
                mostrarNotificacao('Item esgotado ou não encontrado no estoque.', 'erro');
                return;
            }

            // 1. CÁLCULO DE CRÉDITO
            const percentualConsignatario = configuracoes.percentualConsignatario / 100;
            const creditoGerado = valorVenda * percentualConsignatario;
            const comissaoLoja = valorVenda - creditoGerado;

            // 2. ATUALIZAÇÃO DO ESTOQUE
            item.quantidade -= 1;
            if (item.quantidade === 0) {
                item.status = 'Vendido';
            }

            // 3. ATUALIZAÇÃO DO CRÉDITO DO CONSIGNATÁRIO
            if (consignatario) {
                 consignatario.creditos += creditoGerado;
            }
           
            // 4. ATUALIZAÇÃO DO TOTAL DE COMPRAS DO COMPRADOR
            if (comprador) {
                comprador.totalCompras += valorVenda;
            }

            // 5. REGISTRO DA VENDA
            const novaVenda = {
                id: gerarId(vendas),
                itemId: itemId,
                compradorId: compradorId,
                bazarVendaId: item.bazarId,
                valorVenda,
                creditoGerado,
                comissaoLoja,
                dataVenda,
                formaPagamento
            };
            vendas.push(novaVenda);

            salvarDados();
            document.getElementById('formVenda')?.reset();
            mostrarNotificacao(`Venda de ${item.descricao} registrada! Crédito de ${formatarMoeda(creditoGerado)} gerado para ${consignatario?.nome || 'N/A'}.`, 'sucesso', 5000);
        }

        function excluirVenda(id) {
            const venda = vendas.find(v => v.id === id);
            if (!venda || !confirm('Tem certeza que deseja EXCLUIR esta venda? O estoque e o crédito serão revertidos.')) {
                return;
            }
            
            const item = itens.find(i => i.id === venda.itemId);
            const consignatario = item ? clientes.find(c => c.id === item.consignatarioId) : null;
            const comprador = compradores.find(c => c.id === venda.compradorId);

            if (item) {
                item.quantidade += 1;
                item.status = 'Disponível';
            }

            if (consignatario) {
                consignatario.creditos = Math.max(0, consignatario.creditos - venda.creditoGerado);
            }
            
            if (comprador) {
                comprador.totalCompras = Math.max(0, comprador.totalCompras - venda.valorVenda);
            }

            vendas = vendas.filter(v => v.id !== id);
            salvarDados();
            mostrarNotificacao('Venda excluída e estoque/crédito revertidos!', 'aviso');
        }

        function renderizarVendas() {
            popularSelectsVenda();
            const tbody = document.getElementById('tabelaVendasBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = vendas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda)).map(v => {
                const item = itens.find(i => i.id === v.itemId);
                const comprador = compradores.find(c => c.id === v.compradorId);
                const consignatario = item ? clientes.find(c => c.id === item.consignatarioId) : null;
                
                const nomeItem = item ? item.descricao : 'Item Excluído';
                const nomeConsignatario = consignatario ? consignatario.nome : 'N/A';
                const nomeComprador = comprador ? comprador.nome : 'Comprador Excluído';

                return `
                    <tr>
                        <td>${v.id}</td>
                        <td data-label="Item">${nomeItem}</td>
                        <td data-label="Consignatário">${nomeConsignatario}</td>
                        <td data-label="Comprador">${nomeComprador}</td>
                        <td data-label="Valor" class="text-right">${formatarMoeda(v.valorVenda)}</td>
                        <td data-label="Crédito" class="text-right">${formatarMoeda(v.creditoGerado)}</td>
                        <td data-label="Data">${new Date(v.dataVenda).toLocaleDateString()}</td>
                        <td data-label="Pagamento">${v.formaPagamento}</td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="excluirVenda(${v.id})" class="btn btn-danger btn-sm" title="Excluir Venda">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }

        // =========================================
        // GESTÃO DE CONSUMOS / RETIRADAS
        // =========================================
        function popularSelectsConsumo() {
            const selectConsignatario = document.getElementById('consumoConsignatarioId');
            
            if (!selectConsignatario) {
                return;
            }

            selectConsignatario.innerHTML = '<option value="">Selecione o Consignatário...</option>';
            clientes.forEach(c => {
                selectConsignatario.innerHTML += `<option value="${c.id}" data-credito="${c.creditos}">${c.nome} (${formatarMoeda(c.creditos)} de crédito)</option>`;
            });
            
            const consumoData = document.getElementById('consumoData');
            if (consumoData) {
                consumoData.value = obterDataHojeISO();
            }
        }

        function registrarConsumo() {
            const consignatarioId = parseInt(document.getElementById('consumoConsignatarioId')?.value);
            const valor = parseFloat(document.getElementById('consumoValor')?.value);
            const descricao = document.getElementById('consumoDescricao')?.value.trim();
            const data = document.getElementById('consumoData')?.value;

            if (!consignatarioId || isNaN(valor) || valor <= 0 || !data) {
                mostrarNotificacao('Preencha o consignatário, o valor e a data.', 'erro');
                return;
            }

            const consignatario = clientes.find(c => c.id === consignatarioId);

            if (!consignatario) {
                mostrarNotificacao('Consignatário não encontrado.', 'erro');
                return;
            }

            if (valor > consignatario.creditos) {
                mostrarNotificacao(`Valor do consumo (${formatarMoeda(valor)}) é maior que o crédito disponível (${formatarMoeda(consignatario.creditos)}).`, 'erro', 5000);
                return;
            }

            consignatario.creditos -= valor;

            const novoConsumo = {
                id: gerarId(consumos),
                consignatarioId,
                valor,
                data,
                descricao: descricao || 'Retirada de crédito'
            };
            consumos.push(novoConsumo);

            salvarDados();
            document.getElementById('formConsumo')?.reset();
            mostrarNotificacao(`Consumo de ${formatarMoeda(valor)} registrado para ${consignatario.nome}. Saldo atual: ${formatarMoeda(consignatario.creditos)}`, 'sucesso', 5000);
        }

        function excluirConsumo(id) {
            const consumo = consumos.find(c => c.id === id);
            if (!consumo || !confirm('Tem certeza que deseja EXCLUIR este registro de consumo/retirada? O crédito será devolvido ao consignatário.')) {
                return;
            }
            
            const consignatario = clientes.find(c => c.id === consumo.consignatarioId);

            if (consignatario) {
                consignatario.creditos += consumo.valor;
            }

            consumos = consumos.filter(c => c.id !== id);
            salvarDados();
            mostrarNotificacao('Consumo/Retirada excluído e crédito devolvido!', 'aviso');
        }

        function renderizarConsumos() {
            popularSelectsConsumo();
            const tbody = document.getElementById('tabelaConsumosBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            const linhas = consumos.sort((a, b) => new Date(b.data) - new Date(a.data)).map(c => {
                const consignatario = clientes.find(cli => cli.id === c.consignatarioId);
                const nomeConsignatario = consignatario ? consignatario.nome : 'Consignatário Excluído';

                return `
                    <tr>
                        <td>${c.id}</td>
                        <td data-label="Consignatário">${nomeConsignatario}</td>
                        <td data-label="Descrição">${c.descricao}</td>
                        <td data-label="Valor" class="text-right">${formatarMoeda(c.valor)}</td>
                        <td data-label="Data">${new Date(c.data).toLocaleDateString()}</td>
                        <td>
                            <div class="action-buttons-list">
                                <button onclick="excluirConsumo(${c.id})" class="btn btn-danger btn-sm" title="Excluir Consumo">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            tbody.innerHTML = linhas;
        }

        // =========================================
        // DASHBOARD / RELATÓRIOS
        // =========================================
        let chartVendasPorMes, chartVendasPorPagamento;

        function popularFiltrosDashboard() {
            const selectBazar = document.getElementById('filterBazar');
            const selectConsignatario = document.getElementById('filterConsignatario');
            
            if (!selectBazar || !selectConsignatario) return;

            selectBazar.innerHTML = '<option value="">Todos os Bazares</option>';
            bazares.forEach(b => {
                selectBazar.innerHTML += `<option value="${b.id}" ${b.id == currentDashboardFilter.bazarId ? 'selected' : ''}>${b.nome}</option>`;
            });
            

            selectConsignatario.innerHTML = '<option value="">Todos os Consignatários</option>';
            clientes.forEach(c => {
                selectConsignatario.innerHTML += `<option value="${c.id}" ${c.id == currentDashboardFilter.consignatarioId ? 'selected' : ''}>${c.nome}</option>`;
            });
            
            const selectMes = document.getElementById('filterMes');
            if (selectMes) {
                selectMes.value = currentDashboardFilter.mes;
            }
        }

        function filtrarDashboard() {
            const selectMes = document.getElementById('filterMes');
            const selectBazar = document.getElementById('filterBazar');
            const selectConsignatario = document.getElementById('filterConsignatario');

            if (selectMes) currentDashboardFilter.mes = selectMes.value;
            if (selectBazar) currentDashboardFilter.bazarId = selectBazar.value;
            if (selectConsignatario) currentDashboardFilter.consignatarioId = selectConsignatario.value;
            
            renderizarDashboard();
        }

        function renderizarDashboard() {
            if (!document.getElementById('chartVendasMes')) return;
            
            let vendasFiltradas = vendas;

            if (currentDashboardFilter.consignatarioId) {
                const conId = parseInt(currentDashboardFilter.consignatarioId);
                vendasFiltradas = vendasFiltradas.filter(v => 
                    itens.some(i => i.id === v.itemId && i.consignatarioId === conId)
                );
            }

            if (currentDashboardFilter.bazarId) {
                const bId = parseInt(currentDashboardFilter.bazarId);
                vendasFiltradas = vendasFiltradas.filter(v => v.bazarVendaId == bId);
            }
            
            if (currentDashboardFilter.mes) {
                vendasFiltradas = vendasFiltradas.filter(v => v.dataVenda.startsWith(currentDashboardFilter.mes));
            }


            // CÁLCULOS
            const totalVendas = vendasFiltradas.reduce((sum, v) => sum + v.valorVenda, 0);
            const totalComissao = vendasFiltradas.reduce((sum, v) => sum + v.comissaoLoja, 0);
            const totalItensVendidos = vendasFiltradas.length;
            const estoqueAtual = itens.filter(i => i.quantidade > 0).reduce((sum, i) => sum + i.quantidade, 0);

            const consignatariosComCredito = clientes.filter(c => c.creditos > 0).length;
            const totalCreditoPendente = clientes.reduce((sum, c) => sum + c.creditos, 0);


            // ATUALIZAÇÃO DOS CARDS
            document.getElementById('cardTotalVendas').innerText = formatarMoeda(totalVendas);
            document.getElementById('cardTotalComissao').innerText = formatarMoeda(totalComissao);
            document.getElementById('cardItensVendidos').innerText = totalItensVendidos;
            document.getElementById('cardEstoqueAtual').innerText = estoqueAtual;
            document.getElementById('cardCreditoPendente').innerText = formatarMoeda(totalCreditoPendente);
            document.getElementById('cardConsignatariosPendentes').innerText = consignatariosComCredito;


            // GERAÇÃO DOS GRÁFICOS
            const isDarkMode = configuracoes.tema === 'dark';
            const textColor = isDarkMode ? '#f1f5f9' : '#1f2937';
            const gridColor = isDarkMode ? 'rgba(241, 245, 249, 0.1)' : 'rgba(31, 41, 55, 0.1)';
            const primaryColor = isDarkMode ? '#8b5cf6' : '#6d28d9';
            const primaryColorLight = isDarkMode ? '#a78bfa' : '#8b5cf6';


            // 1. Vendas por Mês
            const vendasPorMes = vendasFiltradas.reduce((acc, v) => {
                const mesAno = v.dataVenda.substring(0, 7);
                acc[mesAno] = (acc[mesAno] || 0) + v.valorVenda;
                return acc;
            }, {});
            const sortedMeses = Object.keys(vendasPorMes).sort();
            const labelsMeses = sortedMeses.map(m => {
                 const [ano, mes] = m.split('-');
                 return `${mes}/${ano}`;
            });
            const dadosMeses = sortedMeses.map(m => vendasPorMes[m]);

            const ctxMes = document.getElementById('chartVendasMes');
            if (ctxMes) {
                if (chartVendasPorMes) chartVendasPorMes.destroy();
                chartVendasPorMes = new Chart(ctxMes, {
                    type: 'bar',
                    data: {
                        labels: labelsMeses,
                        datasets: [{
                            label: 'Total de Vendas (BRL)',
                            data: dadosMeses,
                            backgroundColor: primaryColorLight,
                            borderColor: primaryColor,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: textColor },
                                grid: { color: gridColor }
                            },
                            x: {
                                ticks: { color: textColor },
                                grid: { color: gridColor }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: textColor } },
                            tooltip: { callbacks: { label: (context) => formatarMoeda(context.parsed.y) } }
                        }
                    }
                });
            }


            // 2. Vendas por Forma de Pagamento
            const vendasPorPagamento = vendasFiltradas.reduce((acc, v) => {
                acc[v.formaPagamento] = (acc[v.formaPagamento] || 0) + v.valorVenda;
                return acc;
            }, {});
            const labelsPagamento = Object.keys(vendasPorPagamento);
            const dadosPagamento = Object.values(vendasPorPagamento);

            const ctxPagamento = document.getElementById('chartVendasPagamento');
            if (ctxPagamento) {
                if (chartVendasPorPagamento) chartVendasPorPagamento.destroy();
                chartVendasPorPagamento = new Chart(ctxPagamento, {
                    type: 'pie',
                    data: {
                        labels: labelsPagamento,
                        datasets: [{
                            data: dadosPagamento,
                            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', primaryColorLight], 
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top', labels: { color: textColor } },
                            tooltip: { callbacks: { label: ({ label, raw }) => `${label}: ${formatarMoeda(raw)}` } }
                        }
                    }
                });
            }
        }
        
        // =========================================
        // FUNÇÕES DE RELATÓRIOS (PDF)
        // =========================================
        
        // NOVO: Funções para a aba Relatórios
        function popularSelectsRelatorio() {
            const select = document.getElementById('selectRelatorioConsignatario');
            if (!select) return;

            // Mantém a opção de 'Selecione...'
            select.innerHTML = '<option value="">Selecione...</option>';
            clientes.forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        }
        
        function dispararRelatorioConsignatario() {
            const consignatarioId = parseInt(document.getElementById('selectRelatorioConsignatario')?.value);
            
            if (isNaN(consignatarioId)) {
                mostrarNotificacao('Por favor, selecione um consignatário para gerar o relatório.', 'erro');
                return;
            }

            gerarRelatorioConsignatarioPDF(consignatarioId);
        }

        function gerarRelatorioConsignatarioPDF(consignatarioId) {
            const consignatario = clientes.find(c => c.id === consignatarioId);
            if (!consignatario) {
                mostrarNotificacao('Consignatário não encontrado.', 'erro');
                return;
            }

            const vendasConsignatario = vendas.filter(v => 
                itens.some(i => i.id === v.itemId && i.consignatarioId === consignatarioId)
            );
            const consumosConsignatario = consumos.filter(c => c.consignatarioId === consignatarioId);

            const { jsPDF } = window.jspdf; 
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const margin = 10;
            let finalY = margin;

            const isDarkMode = configuracoes.tema === 'dark';
            const primaryColor = isDarkMode ? [139, 92, 246] : [109, 40, 217]; // R, G, B para primary
            const textColor = isDarkMode ? 241 : 31; // 241 para light, 31 para dark


            // --- CABEÇALHO GERAL ---
            doc.setFontSize(18);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(`Relatório de Consignatário`, margin, finalY);
            finalY += 8;
            
            doc.setFontSize(12);
            doc.setTextColor(textColor);
            doc.text(`Nome: ${consignatario.nome}`, margin, finalY);
            finalY += 6;
            doc.setFontSize(10);
            doc.text(`Telefone: ${consignatario.telefone} | Email: ${consignatario.email}`, margin, finalY);
            finalY += 10;
            
            // --- TABELA DE VENDAS ---
            doc.setFontSize(14);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('1. Vendas Detalhadas', margin, finalY);
            finalY += 5;

            const headVendas = [['Data', 'Item', 'Valor Venda', 'Comissão Loja', 'Crédito Gerado', 'Forma Pag.']];
            const bodyVendas = vendasConsignatario.map(v => {
                const item = itens.find(i => i.id === v.itemId);
                return [
                    v.dataVenda,
                    item ? item.descricao : 'Item Removido',
                    formatarMoeda(v.valorVenda),
                    formatarMoeda(v.comissaoLoja),
                    formatarMoeda(v.creditoGerado),
                    v.formaPagamento
                ];
            });

            doc.autoTable({
                startY: finalY,
                head: headVendas,
                body: bodyVendas,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', textColor: textColor },
                didDrawPage: function (data) {
                    finalY = data.cursor.y; 
                }
            });

            // --- TABELA DE CONSUMOS/PAGAMENTOS ---
            finalY += 8; 
            doc.setFontSize(14);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('2. Retiradas / Consumos de Crédito', margin, finalY);
            finalY += 5;

            const headConsumos = [['Data', 'Descrição', 'Valor Consumido']];
            const bodyConsumos = consumosConsignatario.map(c => [
                c.data,
                c.descricao,
                formatarMoeda(c.valor)
            ]);
            
            if (consumosConsignatario.length === 0) {
                bodyConsumos.push(['Nenhuma retirada de crédito registrada.', '', '']);
            }

            doc.autoTable({
                startY: finalY,
                head: headConsumos,
                body: bodyConsumos,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', textColor: textColor },
                didDrawPage: function (data) {
                    finalY = data.cursor.y; 
                }
            });

            // --- RESUMO FINANCEIRO ---
            finalY += 10;
            doc.setFontSize(14);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('3. Resumo Financeiro', margin, finalY);
            finalY += 5;

            const totalCreditoGerado = vendasConsignatario.reduce((sum, v) => sum + v.creditoGerado, 0);
            const totalConsumido = consumosConsignatario.reduce((sum, c) => sum + c.valor, 0);
            const saldoAtual = consignatario.creditos; 

            const resumoData = [
                ['Total de Crédito Gerado (Vendas)', formatarMoeda(totalCreditoGerado)],
                ['Total Consumido/Retirado', formatarMoeda(totalConsumido)],
                ['Saldo Atual (A Pagar)', formatarMoeda(saldoAtual)]
            ];

            doc.autoTable({
                startY: finalY,
                head: [['Metrica', 'Valor']],
                body: resumoData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 3, textColor: textColor },
                columnStyles: {
                    1: { fontStyle: 'bold', halign: 'right' }
                },
                didDrawPage: function (data) {
                    finalY = data.cursor.y;
                }
            });


            // --- FINALIZAÇÃO E DOWNLOAD ---
            const dataRelatorio = obterDataHojeISO();
            doc.save(`Relatorio_Consignatario_${consignatario.id}_${consignatario.nome.replace(/\s/g, '_')}_${dataRelatorio}.pdf`);
            mostrarNotificacao('Relatório de Consignatário gerado com sucesso!', 'sucesso');
        }


        // =========================================
        // CONFIGURAÇÕES
        // =========================================
        function preencherCamposConfiguracao() {
            const percCons = document.getElementById('percentualConsignatario');
            const percLoja = document.getElementById('percentualLoja');
            const validade = document.getElementById('validadeCredito');
            const alerta = document.getElementById('alertaEstoque');

            if (percCons) percCons.value = configuracoes.percentualConsignatario;
            if (percLoja) percLoja.value = configuracoes.percentualLoja;
            if (validade) validade.value = configuracoes.validadeCredito;
            if (alerta) alerta.value = configuracoes.alertaEstoque;
            
            document.documentElement.setAttribute('data-theme', configuracoes.tema);
            const icon = document.querySelector('.theme-toggle i');
            if (icon) { 
                icon.className = configuracoes.tema === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        function salvarConfiguracoes() {
            const percCons = parseInt(document.getElementById('percentualConsignatario')?.value);
            const percLoja = parseInt(document.getElementById('percentualLoja')?.value);
            const validade = parseInt(document.getElementById('validadeCredito')?.value);
            const alerta = parseInt(document.getElementById('alertaEstoque')?.value);

            if (isNaN(percCons) || isNaN(percLoja) || percCons + percLoja !== 100) {
                mostrarNotificacao('A soma do Percentual Consignatário e Percentual Loja deve ser 100.', 'erro');
                return;
            }

            configuracoes.percentualConsignatario = percCons;
            configuracoes.percentualLoja = percLoja;
            configuracoes.validadeCredito = isNaN(validade) ? 6 : validade;
            configuracoes.alertaEstoque = isNaN(alerta) ? 5 : alerta;

            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
            mostrarNotificacao('Configurações salvas com sucesso!', 'sucesso');
            renderizarItens(); 
        }


        // =========================================
        // IMPORTAÇÃO / EXPORTAÇÃO
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
            const json = JSON.stringify(dados, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BazarPlus_Backup_${obterDataHojeISO()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            mostrarNotificacao('Dados exportados com sucesso!', 'sucesso');
        }

        function iniciarImportacao() {
            document.getElementById('importFile')?.click();
        }
        
        function processarImportacao(event) {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            if (!confirm('ATENÇÃO: A importação irá substituir todos os dados atuais. Deseja continuar?')) {
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const dadosImportados = JSON.parse(e.target.result);
                    
                    bazares = dadosImportados.bazares || [];
                    itens = dadosImportados.itens || [];
                    clientes = dadosImportados.clientes || [];
                    compradores = dadosImportados.compradores || [];
                    vendas = dadosImportados.vendas || [];
                    consumos = dadosImportados.consumos || [];
                    if (dadosImportados.configuracoes) {
                        configuracoes = { ...configuracoes, ...dadosImportados.configuracoes };
                    }
                    
                    salvarDados(); 
                    mostrarNotificacao('Dados importados com sucesso! Recarregando a página...', 'sucesso', 5000);
                    
                    setTimeout(() => {
                        location.reload(); 
                    }, 500);

                } catch (error) {
                    mostrarNotificacao('Erro ao processar o arquivo. Certifique-se de que é um arquivo JSON válido do BazarPlus.', 'erro', 7000);
                    console.error('Erro de importação:', error);
                }
            };
            reader.readAsText(file);
        }

        
        document.addEventListener('DOMContentLoaded', () => {
            carregarDados();
            checkInitializers();

            // Seta o active na dashboard ao carregar
            if (document.getElementById('dashboard')) {
                showTab('dashboard');
            } else {
                // Caso não encontre a dashboard, tenta a primeira aba
                 const firstTab = document.querySelector('.tab-nav .tab-button');
                 if (firstTab) {
                    // Extrai o ID da função showTab no onclick
                    const onclickAttr = firstTab.getAttribute('onclick');
                    const match = onclickAttr.match(/'(.*?)'/);
                    if (match && match[1]) {
                        showTab(match[1]);
                    }
                 }
            }


            // Atalhos de teclado
            document.addEventListener('keydown', function(e) {
                // Obtém o ID da aba ativa de forma segura
                const tabAtiva = document.querySelector('.tab-content.active')?.id;
                
                // Ctrl+S para salvar (Cadastrar Item/Cliente)
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    if (tabAtiva === 'itens') {
                        document.getElementById('itemSalvar').click();
                    } else if (tabAtiva === 'consignatarios') {
                        document.getElementById('consignatarioSalvar').click();
                    } else if (tabAtiva === 'compradores') {
                        document.getElementById('compradorSalvar').click();
                    } else if (tabAtiva === 'bazares') {
                        document.getElementById('bazarSalvar').click();
                    }
                }
                // Ctrl+E para exportar
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    exportarDados();
                }
            });
        });
