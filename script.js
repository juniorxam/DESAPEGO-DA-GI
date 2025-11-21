// ========================================
        // VARIÁVEIS GLOBAIS (Simulação de Banco de Dados)
        // ========================================
        let bazares = [];
        let itens = [];
        let clientes = []; // ARRAY DE CONSIGNATÁRIOS (DONOS DOS ITENS)
        let compradores = []; // ARRAY DE CLIENTES COMPRADORES
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

        // ========================================
        // FUNÇÕES DE UTILIDADE
        // ========================================
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
            notif.innerHTML = `<i class="fas fa-${tipo === 'sucesso' ? 'check-circle' : tipo === 'erro' ? 'times-circle' : tipo === 'aviso' ? 'exclamation-triangle' : 'info-circle'}"></i> <span>${mensagem}</span>`;
            
            area.prepend(notif); 

            setTimeout(() => {
                notif.classList.add('show');
            }, 10);

            setTimeout(() => {
                notif.classList.remove('show');
                setTimeout(() => {
                    notif.remove();
                }, 500);
            }, 5000);
        }

        // ========================================
        // GESTÃO DE DADOS (LocalStorage)
        // ========================================
        function salvarDados() {
            localStorage.setItem('bazares', JSON.stringify(bazares));
            localStorage.setItem('itens', JSON.stringify(itens));
            localStorage.setItem('clientes', JSON.stringify(clientes)); // Consignatários
            localStorage.setItem('compradores', JSON.stringify(compradores)); // Compradores
            localStorage.setItem('vendas', JSON.stringify(vendas));
            localStorage.setItem('consumos', JSON.stringify(consumos)); 
            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
            localStorage.setItem('ultimoBackup', new Date().toLocaleString('pt-BR'));
        }

        function carregarDados() {
            const bazaresData = localStorage.getItem('bazares');
            if (bazaresData) { bazares = JSON.parse(bazaresData); }
            const itensData = localStorage.getItem('itens');
            if (itensData) { itens = JSON.parse(itensData); }
            const clientesData = localStorage.getItem('clientes');
            if (clientesData) { clientes = JSON.parse(clientesData); }
            const compradoresData = localStorage.getItem('compradores'); 
            if (compradoresData) { compradores = JSON.parse(compradoresData); } 
            const vendasData = localStorage.getItem('vendas');
            if (vendasData) { vendas = JSON.parse(vendasData); }
            const consumosData = localStorage.getItem('consumos');
            if (consumosData) { consumos = JSON.parse(consumosData); }
            const configData = localStorage.getItem('configuracoes');
            if (configData) {
                configuracoes = { ...configuracoes, ...JSON.parse(configData) };
                aplicarConfiguracoes();
            }
            // Adiciona o campo 'creditos' se ele não existir (para compatibilidade)
            clientes.forEach(c => {
                if (c.creditos === undefined) c.creditos = 0;
            });
            // Adiciona o campo 'totalCompras' se ele não existir
            compradores.forEach(c => {
                if (c.totalCompras === undefined) c.totalCompras = 0;
            });

            if (bazares.length === 0 && itens.length === 0 && clientes.length === 0 && vendas.length === 0) {
                 mostrarNotificacao('Base de dados vazia. Considere carregar os dados de exemplo na aba Configurações.', 'aviso');
            } else {
                 const ultimoBackup = localStorage.getItem('ultimoBackup');
                 if(ultimoBackup) console.log(`Dados carregados. Último salvamento: ${ultimoBackup}`);
            }
        }
        
        function limparTudo(showNotif = true) {
            if (showNotif && !confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
                return;
            }
            localStorage.clear();
            bazares = [];
            itens = [];
            clientes = [];
            compradores = [];
            vendas = [];
            consumos = [];
            configuracoes = { percentualConsignatario: 80, percentualLoja: 20, validadeCredito: 6, alertaEstoque: 5, tema: 'light' };
            // Recarrega a página para resetar o estado.
            location.reload(); 
        }

        // --- Funções de Importação e Exportação ---
        function exportarDados() {
            const data = {
                bazares,
                itens,
                clientes,
                compradores,
                vendas,
                consumos,
                configuracoes
            };
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bazarplus_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            mostrarNotificacao('Backup completo exportado com sucesso!', 'sucesso');
        }

        function iniciarImportacaoGeral() {
            document.getElementById('importFile').click();
        }
        
        function processarImportacao(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (confirm('Tem certeza que deseja RESTAURAR este backup? Os dados atuais serão substituídos.')) {
                        bazares = importedData.bazares || [];
                        itens = importedData.itens || [];
                        clientes = importedData.clientes || [];
                        compradores = importedData.compradores || [];
                        vendas = importedData.vendas || [];
                        consumos = importedData.consumos || [];
                        configuracoes = { ...configuracoes, ...importedData.configuracoes };
                        
                        salvarDados();
                        // Recarrega a página para aplicar os dados
                        location.reload(); 
                        mostrarNotificacao('Dados restaurados com sucesso!', 'sucesso');
                    }
                } catch (error) {
                    mostrarNotificacao('Erro ao processar o arquivo JSON. Certifique-se de que o formato está correto.', 'erro');
                    console.error('Erro de importação:', error);
                }
            };
            reader.readAsText(file);
        }
        
        // ========================================
        // ========================================
        // FUNÇÃO DE DADOS DE EXEMPLO (CORRIGIDA)
        // ========================================
        function carregarDadosDeExemplo() {
            if (!confirm('Esta ação limpará todos os dados existentes e carregará 20 exemplos de vendas e estoque. Continuar?')) {
                return;
            }
            limparTudo(false); // Limpa sem perguntar novamente

            // As variáveis globais foram resetadas por limparTudo, agora vamos preenchê-las.

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
            
            // Adiciona mais itens que estarão APENAS disponíveis
            novosItens.push(
                { id: 11, descricao: 'Camiseta Básica P', consignatarioId: 2, valor: 45.00, quantidade: 3, bazarId: 2, status: 'Disponível' },
                { id: 12, descricao: 'Porta Retratos Grande', consignatarioId: 5, valor: 90.00, quantidade: 1, bazarId: 2, status: 'Disponível' }
            );
            itens = novosItens;

            // 5. REGISTRO DE 20 VENDAS ALEATÓRIAS
            for (let i = 0; i < 20; i++) {
                const itemId = (i % descricoesItens.length) + 1; // Itens 1 a 10
                const itemBase = itens.find(item => item.id === itemId);
                if (!itemBase) continue; 

                const valorVenda = parseFloat((itemBase.valor * (Math.random() * 0.2 + 0.9)).toFixed(2));
                const consignatario = clientes.find(c => c.id === itemBase.consignatarioId);
                const comprador = compradores[(i % compradores.length)];
                
                const percentualConsignatario = configuracoes.percentualConsignatario / 100;
                const creditoGerado = valorVenda * percentualConsignatario;
                const comissaoLoja = valorVenda - creditoGerado;
                
                // Atualiza o estoque: O item foi vendido, então ele deve ser contado como 'consumido' do estoque inicial. 
                // Como não iniciamos o estoque, o contador de quantidade de itens vendidos é 0
                // itemBase.quantidade é o estoque ATUAL que sobra.
                itemBase.quantidade = 0; // O item foi vendido e não sobrou mais nada. 
                itemBase.status = 'Vendido'; 
                
                // Atualiza o crédito do consignatário
                consignatario.creditos = (consignatario.creditos || 0) + creditoGerado;

                // Atualiza o total de compras do comprador
                comprador.totalCompras = (comprador.totalCompras || 0) + valorVenda;

                // Define a data de venda aleatória nos últimos 60 dias
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
                    comissaoLoja,
                    dataVenda,
                    formaPagamento: ['PIX', 'Cartao', 'Dinheiro'][(i % 3)]
                });
            }
            
            // 6. REGISTRO DE CONSUMOS (PARA TESTAR DEDUÇÃO DE CRÉDITO)
            // Apenas para consignatários que tiveram crédito gerado (Ana Silva)
            const anaSilva = clientes.find(c => c.id === 1); 
            if (anaSilva && anaSilva.creditos > 50) {
                 consumos.push({
                    id: 1,
                    consignatarioId: 1, 
                    valor: 50.00,
                    data: obterDataHojeISO(),
                    descricao: 'Retirada de crédito em dinheiro (Teste)'
                });
                anaSilva.creditos -= 50.00;
            }


            // Salva todos os dados na storage antes de recarregar
            localStorage.setItem('bazares', JSON.stringify(bazares));
            localStorage.setItem('itens', JSON.stringify(itens));
            localStorage.setItem('clientes', JSON.stringify(clientes)); 
            localStorage.setItem('compradores', JSON.stringify(compradores)); 
            localStorage.setItem('vendas', JSON.stringify(vendas));
            localStorage.setItem('consumos', JSON.stringify(consumos)); 
            localStorage.setItem('configuracoes', JSON.stringify(configuracoes));
            
            mostrarNotificacao('20 Vendas, 5 Consignatários e 12 Itens de exemplo carregados! Recarregando a página...', 'sucesso');
            
            // Recarrega a página para iniciar o app com os novos dados
            setTimeout(() => {
                location.reload(); 
            }, 100);
        }
        // ========================================
        // GESTÃO DE TABS E INICIALIZAÇÃO
        // ========================================
        function openTab(evt, tabName) {
            // Esconde todos os elementos com a classe tab-content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // Remove a classe "active" de todos os botões
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });

            // Mostra o conteúdo da aba atual e adiciona a classe "active" ao botão que abriu a aba
            document.getElementById(tabName).classList.add('active');
            evt.currentTarget.classList.add('active');

            // Chamada de funções de atualização específicas para cada aba
            if (tabName === 'dashboard') renderizarDashboard();
            if (tabName === 'bazares') atualizarListaBazares();
            if (tabName === 'itens') renderizarItens();
            if (tabName === 'consignatarios') atualizarListaConsignatarios();
            if (tabName === 'compradores') atualizarListaCompradores();
            if (tabName === 'vendas') {
                carregarItensDisponiveis();
                carregarOpcoesCompradoresVenda();
                carregarOpcoesBazaresVenda();
                renderizarVendas();
            }
            if (tabName === 'consumos') {
                carregarOpcoesConsignatariosConsumo();
                renderizarConsumos();
            }
            if (tabName === 'relatorios') {
                // Prepara a aba de relatórios
                document.getElementById('relatorioPreview').innerHTML = '<p style="color: var(--text-muted); text-align: center;">Selecione o tipo de relatório e clique em "Gerar Relatório".</p>';
            }
        }
        
        function checkInitializers() {
            // Preenche datas
            document.getElementById('dataVenda').value = obterDataHojeISO();
            document.getElementById('dataConsumo').value = obterDataHojeISO();
            
            // Carrega as configurações (tema e percentuais)
            aplicarConfiguracoes();
            
            // Carrega opções de seleção
            carregarOpcoesConsignatarios(true); // Para filtro de Itens e Consumo
            carregarOpcoesBazares(true); // Para filtro de Itens

            // Renderiza as abas ativas
            renderizarDashboard();
            renderizarItens(); 
            atualizarListaConsignatarios();
            atualizarListaCompradores();
            
            // Define o tema inicial
            const temaSalvo = configuracoes.tema || 'light';
            document.documentElement.setAttribute('data-theme', temaSalvo);
            document.querySelector('.theme-toggle i').className = temaSalvo === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // ========================================
        // FUNÇÕES DE CONFIGURAÇÃO (Tema e Parâmetros)
        // ========================================
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            document.querySelector('.theme-toggle i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            configuracoes.tema = newTheme;
            salvarDados();
            mostrarNotificacao(`Tema alterado para ${newTheme === 'dark' ? 'Escuro' : 'Claro'}`, 'info');
        }

        function aplicarConfiguracoes() {
            document.getElementById('percentualConsignatario').value = configuracoes.percentualConsignatario;
            document.getElementById('percentualLoja').value = configuracoes.percentualLoja;
            document.getElementById('validadeCredito').value = configuracoes.validadeCredito;
            document.getElementById('alertaEstoque').value = configuracoes.alertaEstoque;
            const temaSistema = document.getElementById('temaSistema');
            if (temaSistema) temaSistema.value = configuracoes.tema;

            // Aplica tema
            document.documentElement.setAttribute('data-theme', configuracoes.tema);
        }

        function salvarConfiguracoes() {
            configuracoes.percentualConsignatario = parseFloat(document.getElementById('percentualConsignatario').value);
            configuracoes.percentualLoja = parseFloat(document.getElementById('percentualLoja').value);
            configuracoes.validadeCredito = parseInt(document.getElementById('validadeCredito').value);
            configuracoes.alertaEstoque = parseInt(document.getElementById('alertaEstoque').value);
            
            if (configuracoes.percentualConsignatario + configuracoes.percentualLoja !== 100) {
                mostrarNotificacao('A soma dos percentuais da Loja e do Consignatário deve ser 100%.', 'erro');
                return;
            }

            salvarDados();
            mostrarNotificacao('Configurações salvas com sucesso!', 'sucesso');
            renderizarDashboard(); // Atualiza dashboard com novos percentuais se necessário
        }

        function mudarTemaSistema() {
            const novoTema = document.getElementById('temaSistema').value;
            document.documentElement.setAttribute('data-theme', novoTema);
            configuracoes.tema = novoTema;
            salvarDados();
        }

        // ========================================
        // GESTÃO DE BAZARES
        // ========================================
        function criarBazar() {
            const nome = document.getElementById('nomeBazar').value.trim();
            const dataInicio = document.getElementById('dataInicioBazar').value;
            const dataFim = document.getElementById('dataFimBazar').value;

            if (!nome || !dataInicio) {
                mostrarNotificacao('Preencha o nome e a data de início do bazar.', 'aviso');
                return;
            }
            
            const novoBazar = {
                id: gerarId(bazares),
                nome,
                dataInicio,
                dataFim: dataFim || null,
                totalVendas: 0,
                itensVendidos: 0
            };
            bazares.push(novoBazar);
            salvarDados();
            document.getElementById('nomeBazar').value = '';
            document.getElementById('dataInicioBazar').value = '';
            document.getElementById('dataFimBazar').value = '';
            mostrarNotificacao('Bazar criado com sucesso!', 'sucesso');
            atualizarListaBazares();
            carregarOpcoesBazares(true); // Atualiza filtros e selects
        }
        
        function atualizarListaBazares() {
            const tbody = document.getElementById('bazaresTable').querySelector('tbody');
            tbody.innerHTML = '';
            
            bazares.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio)); 

            bazares.forEach(bazar => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${bazar.id}</td>
                    <td>${bazar.nome}</td>
                    <td>${new Date(bazar.dataInicio).toLocaleDateString('pt-BR')}</td>
                    <td>${bazar.dataFim ? new Date(bazar.dataFim).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                        <button onclick="excluirBazar(${bazar.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });
            if (bazares.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum bazar cadastrado.</td></tr>`;
            }
        }
        
        function excluirBazar(bazarId) {
            const index = bazares.findIndex(b => b.id === bazarId);
            if (index > -1) {
                 if (itens.some(i => i.bazarId === bazarId)) {
                    mostrarNotificacao('Não é possível excluir o bazar. Existem itens vinculados a ele.', 'erro');
                    return;
                }
                if (confirm('Tem certeza que deseja excluir este bazar?')) {
                    bazares.splice(index, 1);
                    salvarDados();
                    mostrarNotificacao('Bazar excluído com sucesso!', 'sucesso');
                    atualizarListaBazares();
                    carregarOpcoesBazares(true);
                }
            }
        }


        // Função auxiliar para carregar opções de bazar em selects
        function carregarOpcoesBazares(incluirFiltros = false) {
            const selects = [
                document.getElementById('bazarItemId'),
                document.getElementById('filtroBazarItem'),
                document.getElementById('bazarVendaId'),
                document.getElementById('filtroBazarVenda'),
                document.getElementById('filtroBazarDashboard')
            ];

            selects.forEach(select => {
                if (!select) return;
                const valorAtual = select.value;
                select.innerHTML = '';
                
                if (incluirFiltros) {
                    select.innerHTML += '<option value="">Todos os Bazares</option>';
                } else {
                    select.innerHTML += '<option value="">Selecione o Bazar</option>';
                }

                bazares.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio)).forEach(b => {
                    select.innerHTML += `<option value="${b.id}">${b.nome}</option>`;
                });
                select.value = valorAtual;
            });
        }
        // Funções específicas para selects de Vendas e Dashboard
        function carregarOpcoesBazaresVenda() {
            carregarOpcoesBazares(true);
        }

        // ========================================
        // GESTÃO DE CONSIGNATÁRIOS
        // ========================================
        function adicionarConsignatario() {
            const nome = document.getElementById('nomeConsignatario').value.trim();
            const telefone = document.getElementById('telefoneConsignatario').value.trim();
            const email = document.getElementById('emailConsignatario').value.trim();

            if (!nome) {
                mostrarNotificacao('O nome do Consignatário é obrigatório.', 'aviso');
                return;
            }

            const novoConsignatario = {
                id: gerarId(clientes),
                nome,
                telefone: telefone || '',
                email: email || '',
                creditos: 0.00 // Saldo inicial sempre zero
            };

            clientes.push(novoConsignatario);
            salvarDados();
            document.getElementById('nomeConsignatario').value = '';
            document.getElementById('telefoneConsignatario').value = '';
            document.getElementById('emailConsignatario').value = '';
            mostrarNotificacao('Consignatário cadastrado com sucesso!', 'sucesso');
            atualizarListaConsignatarios();
            carregarOpcoesConsignatarios(true);
        }

        function atualizarListaConsignatarios() {
            const tbody = document.getElementById('consignatariosTable').querySelector('tbody');
            tbody.innerHTML = '';

            clientes.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${c.id}</td>
                    <td>${c.nome}</td>
                    <td>${c.telefone || '-'}</td>
                    <td class="${(c.creditos || 0) < 0 ? 'text-danger' : 'text-success'}">${formatarMoeda(c.creditos)}</td>
                    <td>
                        <button onclick="excluirConsignatario(${c.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });
            if (clientes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Nenhum consignatário cadastrado.</td></tr>`;
            }
        }
        
        function excluirConsignatario(consignatarioId) {
            const index = clientes.findIndex(c => c.id === consignatarioId);
            if (index > -1) {
                 if (itens.some(i => i.consignatarioId === consignatarioId)) {
                    mostrarNotificacao('Não é possível excluir. Existem itens vinculados a este consignatário.', 'erro');
                    return;
                }
                if (clientes[index].creditos !== 0) {
                    mostrarNotificacao('Não é possível excluir o consignatário. O saldo de crédito deve ser zero.', 'erro');
                    return;
                }
                if (confirm('Tem certeza que deseja excluir este consignatário?')) {
                    clientes.splice(index, 1);
                    salvarDados();
                    mostrarNotificacao('Consignatário excluído com sucesso!', 'sucesso');
                    atualizarListaConsignatarios();
                    carregarOpcoesConsignatarios(true);
                }
            }
        }


        // Função auxiliar para carregar opções de consignatário em selects
        function carregarOpcoesConsignatarios(incluirFiltros = false) {
            const selects = [
                document.getElementById('consignatarioItemId'),
                document.getElementById('filtroConsignatarioItem'),
                document.getElementById('filtroConsignatarioVenda'),
                document.getElementById('consignatarioConsumoId'),
                document.getElementById('filtroConsignatarioConsumo'),
                document.getElementById('filtroConsignatarioDashboard')
            ];

            clientes.sort((a, b) => a.nome.localeCompare(b.nome));

            selects.forEach(select => {
                if (!select) return;
                const valorAtual = select.value;
                select.innerHTML = '';
                
                if (incluirFiltros) {
                    select.innerHTML += '<option value="">Todos os Consignatários</option>';
                } else {
                    select.innerHTML += '<option value="">Selecione o Consignatário</option>';
                }

                clientes.forEach(c => {
                    select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
                });
                select.value = valorAtual;
            });
        }

        function carregarOpcoesConsignatariosConsumo() {
            // Atualiza apenas os campos de Consumo
            const select = document.getElementById('consignatarioConsumoId');
            if (!select) return;
            select.innerHTML = '<option value="">Selecione o Consignatário</option>';
            clientes.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.nome} (${formatarMoeda(c.creditos)})</option>`;
            });
        }
        
        // ========================================
        // GESTÃO DE COMPRADORES
        // ========================================
        function adicionarComprador() {
            const nome = document.getElementById('nomeComprador').value.trim();
            const telefone = document.getElementById('telefoneComprador').value.trim();

            if (!nome) {
                mostrarNotificacao('O nome do Comprador é obrigatório.', 'aviso');
                return;
            }

            const novoComprador = {
                id: gerarId(compradores),
                nome,
                telefone: telefone || '',
                totalCompras: 0.00
            };

            compradores.push(novoComprador);
            salvarDados();
            document.getElementById('nomeComprador').value = '';
            document.getElementById('telefoneComprador').value = '';
            mostrarNotificacao('Comprador cadastrado com sucesso!', 'sucesso');
            atualizarListaCompradores();
            carregarOpcoesCompradoresVenda();
        }

        function atualizarListaCompradores() {
            const tbody = document.getElementById('compradoresTable').querySelector('tbody');
            tbody.innerHTML = '';

            compradores.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${c.id}</td>
                    <td>${c.nome}</td>
                    <td>${c.telefone || '-'}</td>
                    <td>
                        <button onclick="excluirComprador(${c.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });
            if (compradores.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum comprador cadastrado.</td></tr>`;
            }
        }
        
        function excluirComprador(compradorId) {
            const index = compradores.findIndex(c => c.id === compradorId);
            if (index > -1) {
                 if (vendas.some(v => v.compradorId === compradorId)) {
                    mostrarNotificacao('Não é possível excluir. Existem vendas vinculadas a este comprador.', 'erro');
                    return;
                }
                if (confirm('Tem certeza que deseja excluir este comprador?')) {
                    compradores.splice(index, 1);
                    salvarDados();
                    mostrarNotificacao('Comprador excluído com sucesso!', 'sucesso');
                    atualizarListaCompradores();
                    carregarOpcoesCompradoresVenda();
                }
            }
        }

        
        // Função auxiliar para carregar opções de comprador em selects
        function carregarOpcoesCompradoresVenda() {
            const select = document.getElementById('compradorVendaId');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione o Comprador</option>';
            compradores.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
                select.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
            });
        }


        // ========================================
        // GESTÃO DE ITENS
        // ========================================
        function adicionarItem() {
            const descricao = document.getElementById('descricaoItem').value.trim();
            const consignatarioId = parseInt(document.getElementById('consignatarioItemId').value);
            const valor = parseFloat(document.getElementById('valorItem').value);
            const quantidade = parseInt(document.getElementById('quantidadeItem').value);
            const bazarId = document.getElementById('bazarItemId').value ? parseInt(document.getElementById('bazarItemId').value) : null;
            const status = document.getElementById('statusItem').value;

            if (!descricao || !consignatarioId || isNaN(valor) || valor <= 0 || isNaN(quantidade) || quantidade <= 0) {
                mostrarNotificacao('Preencha a descrição, o consignatário, o valor e a quantidade corretamente.', 'aviso');
                return;
            }

            const novoItem = {
                id: gerarId(itens),
                descricao,
                consignatarioId,
                valor,
                quantidade,
                bazarId,
                status // Status inicial é "Disponível" se não for "Vendido" (caso de edição)
            };

            itens.push(novoItem);
            salvarDados();
            
            // Limpa o formulário
            document.getElementById('descricaoItem').value = '';
            document.getElementById('valorItem').value = '';
            document.getElementById('quantidadeItem').value = '1';
            document.getElementById('consignatarioItemId').value = '';
            document.getElementById('bazarItemId').value = '';
            document.getElementById('statusItem').value = 'Disponível';

            mostrarNotificacao('Item cadastrado com sucesso!', 'sucesso');
            renderizarItens();
            carregarItensDisponiveis();
            renderizarDashboard();
        }

        function renderizarItens() {
            const tbody = document.getElementById('itensTable').querySelector('tbody');
            tbody.innerHTML = '';

            // Filtros
            const filtroDescricao = document.getElementById('filtroDescricaoItem').value.toLowerCase();
            const filtroConsignatario = document.getElementById('filtroConsignatarioItem').value;
            const filtroBazar = document.getElementById('filtroBazarItem').value;
            const filtroStatus = document.getElementById('filtroStatusItem').value;

            let itensFiltrados = itens.filter(item => {
                let passa = true;

                if (filtroDescricao && !item.descricao.toLowerCase().includes(filtroDescricao)) passa = false;
                if (filtroConsignatario && item.consignatarioId !== parseInt(filtroConsignatario)) passa = false;
                if (filtroBazar && item.bazarId !== parseInt(filtroBazar)) passa = false;
                if (filtroStatus && item.status !== filtroStatus) passa = false;

                return passa;
            });
            
            itensFiltrados.sort((a, b) => a.id - b.id);

            itensFiltrados.forEach(item => {
                const consignatario = clientes.find(c => c.id === item.consignatarioId);
                const bazar = bazares.find(b => b.id === item.bazarId);
                
                let statusClass = 'status-badge';
                if (item.status === 'Disponível') statusClass += ' success';
                if (item.status === 'Vendido') statusClass += ' danger';
                if (item.status === 'Reservado') statusClass += ' info';

                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.descricao}</td>
                    <td>${consignatario ? consignatario.nome : 'N/A'}</td>
                    <td>${formatarMoeda(item.valor)}</td>
                    <td>${item.quantidade}</td>
                    <td>${bazar ? bazar.nome : '-'}</td>
                    <td><span class="${statusClass}">${item.status}</span></td>
                    <td>
                        <button onclick="excluirItem(${item.id})" class="btn btn-danger btn-sm" ${item.status === 'Vendido' ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });

            if (itensFiltrados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhum item encontrado com os filtros aplicados.</td></tr>`;
            }
        }
        
        function limparFiltrosItens() {
            document.getElementById('filtroDescricaoItem').value = '';
            document.getElementById('filtroConsignatarioItem').value = '';
            document.getElementById('filtroBazarItem').value = '';
            document.getElementById('filtroStatusItem').value = '';
            renderizarItens();
        }

        function excluirItem(itemId) {
            const itemIndex = itens.findIndex(i => i.id === itemId);
            if (itemIndex > -1) {
                const item = itens[itemIndex];
                if (item.status === 'Vendido') {
                    mostrarNotificacao('Não é possível excluir um item que já foi vendido.', 'erro');
                    return;
                }
                
                if (confirm(`Tem certeza que deseja excluir o item ${item.descricao}?`)) {
                    itens.splice(itemIndex, 1);
                    salvarDados();
                    mostrarNotificacao('Item excluído com sucesso.', 'sucesso');
                    renderizarItens();
                    carregarItensDisponiveis();
                    renderizarDashboard();
                }
            }
        }

        // ========================================
        // GESTÃO DE VENDAS
        // ========================================

        // Carrega itens com status 'Disponível' e quantidade > 0
        function carregarItensDisponiveis() {
            const select = document.getElementById('itemVendidoId');
            if (!select) return;

            select.innerHTML = '<option value="">Selecione o Item (Disponível)</option>';
            
            const itensDisponiveis = itens.filter(i => 
                i.status === 'Disponível' && i.quantidade > 0
            );

            itensDisponiveis.sort((a, b) => a.descricao.localeCompare(b.descricao)).forEach(i => {
                const consignatario = clientes.find(c => c.id === i.consignatarioId);
                const nomeConsignatario = consignatario ? consignatario.nome : 'N/A';
                
                select.innerHTML += `<option value="${i.id}" data-valor="${i.valor}">${i.descricao} (R$ ${i.valor.toFixed(2)}) - ${nomeConsignatario}</option>`;
            });
        }
        
        // Preenche o campo de valor da venda com o preço do item
        function preencherValorVenda() {
            const selectItem = document.getElementById('itemVendidoId');
            const inputValor = document.getElementById('valorVenda');
            const selectedOption = selectItem.options[selectItem.selectedIndex];

            if (selectedOption && selectedOption.value) {
                const valor = parseFloat(selectedOption.getAttribute('data-valor'));
                inputValor.value = valor.toFixed(2);
            } else {
                inputValor.value = '';
            }
        }

        function registrarVenda() {
            const compradorId = parseInt(document.getElementById('compradorVendaId').value);
            const bazarVendaId = parseInt(document.getElementById('bazarVendaId').value);
            const itemId = parseInt(document.getElementById('itemVendidoId').value);
            const valorVenda = parseFloat(document.getElementById('valorVenda').value);
            const dataVenda = document.getElementById('dataVenda').value;
            const formaPagamento = document.getElementById('formaPagamentoVenda').value;

            if (isNaN(compradorId) || isNaN(bazarVendaId) || isNaN(itemId) || isNaN(valorVenda) || valorVenda <= 0 || !dataVenda || !formaPagamento) {
                mostrarNotificacao('Preencha todos os campos da venda corretamente.', 'aviso');
                return;
            }

            const itemVendido = itens.find(i => i.id === itemId);
            if (!itemVendido || itemVendido.quantidade <= 0) {
                mostrarNotificacao('Item indisponível para venda.', 'erro');
                return;
            }

            const consignatario = clientes.find(c => c.id === itemVendido.consignatarioId);
            if (!consignatario) {
                mostrarNotificacao('Consignatário do item não encontrado.', 'erro');
                return;
            }

            // 1. CÁLCULO DE CRÉDITO
            const percentualConsignatario = configuracoes.percentualConsignatario / 100;
            const creditoGerado = valorVenda * percentualConsignatario;
            const comissaoLoja = valorVenda - creditoGerado;

            // 2. ATUALIZAÇÃO DO CRÉDITO DO CONSIGNATÁRIO
            consignatario.creditos = (consignatario.creditos || 0) + creditoGerado;

            // 3. ATUALIZAÇÃO DO ESTOQUE (Item)
            itemVendido.quantidade -= 1;
            if (itemVendido.quantidade === 0) {
                itemVendido.status = 'Vendido';
            } else {
                 itemVendido.status = 'Disponível'; // Garante que o status volte a disponível se houver mais
            }

            // 4. ATUALIZAÇÃO DO TOTAL DE COMPRAS DO COMPRADOR
            const comprador = compradores.find(c => c.id === compradorId);
            if (comprador) {
                comprador.totalCompras = (comprador.totalCompras || 0) + valorVenda;
            }

            // 5. REGISTRO DA VENDA
            const novaVenda = {
                id: gerarId(vendas),
                itemId,
                compradorId,
                bazarVendaId,
                valorVenda,
                creditoGerado: creditoGerado,
                comissaoLoja: comissaoLoja,
                dataVenda,
                formaPagamento
            };
            vendas.push(novaVenda);

            salvarDados();
            mostrarNotificacao('Venda registrada e crédito gerado com sucesso!', 'sucesso');
            
            // Re-renderização
            document.getElementById('valorVenda').value = '';
            document.getElementById('itemVendidoId').value = '';
            carregarItensDisponiveis();
            renderizarVendas();
            atualizarListaConsignatarios(); // Saldo foi alterado
            renderizarDashboard();
        }

        function renderizarVendas() {
            const tbody = document.getElementById('vendasTable').querySelector('tbody');
            tbody.innerHTML = '';
            
            // Filtros
            const filtroBazar = document.getElementById('filtroBazarVenda').value;
            const filtroConsignatario = document.getElementById('filtroConsignatarioVenda').value;
            const filtroComprador = document.getElementById('filtroCompradorVenda').value;
            const filtroDataInicial = document.getElementById('filtroDataInicialVenda').value;
            const filtroDataFinal = document.getElementById('filtroDataFinalVenda').value;

            let vendasFiltradas = vendas.filter(v => {
                let passa = true;
                const item = itens.find(i => i.id === v.itemId);

                if (filtroBazar && v.bazarVendaId !== parseInt(filtroBazar)) passa = false;
                if (filtroComprador && v.compradorId !== parseInt(filtroComprador)) passa = false;
                
                if (filtroConsignatario && (!item || item.consignatarioId !== parseInt(filtroConsignatario))) passa = false;
                
                if (filtroDataInicial && v.dataVenda < filtroDataInicial) passa = false;
                if (filtroDataFinal && v.dataVenda > filtroDataFinal) passa = false;

                return passa;
            });

            vendasFiltradas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda));

            vendasFiltradas.forEach(venda => {
                const item = itens.find(i => i.id === venda.itemId);
                const comprador = compradores.find(c => c.id === venda.compradorId);
                const bazar = bazares.find(b => b.id === venda.bazarVendaId);
                const consignatario = item ? clientes.find(c => c.id === item.consignatarioId) : null;

                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${venda.id}</td>
                    <td>${new Date(venda.dataVenda).toLocaleDateString('pt-BR')}</td>
                    <td>${item ? item.descricao : 'Item Excluído'}</td>
                    <td>${consignatario ? consignatario.nome : 'N/A'}</td>
                    <td>${comprador ? comprador.nome : 'N/A'}</td>
                    <td>${formatarMoeda(venda.valorVenda)}</td>
                    <td>${formatarMoeda(venda.creditoGerado)}</td>
                    <td>${bazar ? bazar.nome : 'N/A'}</td>
                    <td>
                        <button onclick="excluirVenda(${venda.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });
            if (vendasFiltradas.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">Nenhuma venda registrada com os filtros aplicados.</td></tr>`;
            }
        }
        
        function excluirVenda(vendaId) {
            const vendaIndex = vendas.findIndex(v => v.id === vendaId);
            if (vendaIndex > -1) {
                const venda = vendas[vendaIndex];
                const item = itens.find(i => i.id === venda.itemId);
                const consignatario = item ? clientes.find(c => c.id === item.consignatarioId) : null;
                const comprador = compradores.find(c => c.id === venda.compradorId);

                if (confirm(`Tem certeza que deseja excluir a venda de ${formatarMoeda(venda.valorVenda)}? O crédito será revertido e o estoque será ajustado.`)) {
                    
                    // 1. REVERTER CRÉDITO
                    if (consignatario) {
                        consignatario.creditos -= venda.creditoGerado;
                    }
                    
                    // 2. REVERTER ESTOQUE (Item)
                    if (item) {
                        item.quantidade += 1;
                        item.status = 'Disponível';
                    }
                    
                    // 3. REVERTER TOTAL DE COMPRAS DO COMPRADOR
                    if (comprador) {
                        comprador.totalCompras -= venda.valorVenda;
                    }

                    // 4. REMOVER VENDA
                    vendas.splice(vendaIndex, 1);
                    salvarDados();
                    mostrarNotificacao('Venda excluída e saldos revertidos com sucesso!', 'sucesso');
                    
                    // Re-renderização
                    carregarItensDisponiveis();
                    renderizarVendas();
                    atualizarListaConsignatarios();
                    renderizarDashboard();
                }
            }
        }

        function limparFiltrosVendas() {
            document.getElementById('filtroBazarVenda').value = '';
            document.getElementById('filtroConsignatarioVenda').value = '';
            document.getElementById('filtroCompradorVenda').value = '';
            document.getElementById('filtroDataInicialVenda').value = '';
            document.getElementById('filtroDataFinalVenda').value = '';
            renderizarVendas();
        }


        // ========================================
        // GESTÃO DE CONSUMOS (Uso de Crédito)
        // ========================================
        
        function atualizarSaldoConsignatario() {
            const consignatarioId = parseInt(document.getElementById('consignatarioConsumoId').value);
            const saldoInput = document.getElementById('saldoConsignatario');
            
            if (isNaN(consignatarioId)) {
                saldoInput.value = formatarMoeda(0);
                return;
            }

            const consignatario = clientes.find(c => c.id === consignatarioId);
            if (consignatario) {
                saldoInput.value = formatarMoeda(consignatario.creditos || 0);
            } else {
                saldoInput.value = formatarMoeda(0);
            }
        }

        function registrarConsumo() {
            const consignatarioId = parseInt(document.getElementById('consignatarioConsumoId').value);
            const valorConsumo = parseFloat(document.getElementById('valorConsumo').value);
            const dataConsumo = document.getElementById('dataConsumo').value;
            const descricaoConsumo = document.getElementById('descricaoConsumo').value.trim();

            if (isNaN(consignatarioId) || isNaN(valorConsumo) || valorConsumo <= 0 || !dataConsumo || !descricaoConsumo) {
                mostrarNotificacao('Preencha todos os campos do consumo corretamente.', 'aviso');
                return;
            }

            const consignatario = clientes.find(c => c.id === consignatarioId);
            if (!consignatario) {
                mostrarNotificacao('Consignatário não encontrado.', 'erro');
                return;
            }

            if ((consignatario.creditos || 0) < valorConsumo) {
                if (!confirm(`O Consignatário possui apenas ${formatarMoeda(consignatario.creditos)}. Deseja registrar o consumo de ${formatarMoeda(valorConsumo)} e deixar o saldo negativo?`)) {
                    return;
                }
            }

            // 1. DEDUÇÃO DO CRÉDITO
            consignatario.creditos -= valorConsumo;

            // 2. REGISTRO DO CONSUMO
            const novoConsumo = {
                id: gerarId(consumos),
                consignatarioId,
                valor: valorConsumo,
                data: dataConsumo,
                descricao: descricaoConsumo
            };
            consumos.push(novoConsumo);

            salvarDados();
            mostrarNotificacao('Uso de crédito (consumo) registrado com sucesso!', 'sucesso');
            
            // Limpa o formulário
            document.getElementById('valorConsumo').value = '';
            document.getElementById('descricaoConsumo').value = '';
            atualizarSaldoConsignatario(); // Atualiza o saldo exibido
            renderizarConsumos();
            atualizarListaConsignatarios(); // Saldo foi alterado
            renderizarDashboard();
        }

        function renderizarConsumos() {
            const tbody = document.getElementById('consumosTable').querySelector('tbody');
            tbody.innerHTML = '';
            
            // Filtros
            const filtroConsignatario = document.getElementById('filtroConsignatarioConsumo').value;
            const filtroDataInicial = document.getElementById('filtroDataInicialConsumo').value;
            const filtroDataFinal = document.getElementById('filtroDataFinalConsumo').value;

            let consumosFiltrados = consumos.filter(c => {
                let passa = true;

                if (filtroConsignatario && c.consignatarioId !== parseInt(filtroConsignatario)) passa = false;
                if (filtroDataInicial && c.data < filtroDataInicial) passa = false;
                if (filtroDataFinal && c.data > filtroDataFinal) passa = false;

                return passa;
            });

            consumosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

            consumosFiltrados.forEach(consumo => {
                const consignatario = clientes.find(c => c.id === consumo.consignatarioId);

                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${consumo.id}</td>
                    <td>${new Date(consumo.data).toLocaleDateString('pt-BR')}</td>
                    <td>${consignatario ? consignatario.nome : 'N/A'}</td>
                    <td>${consumo.descricao}</td>
                    <td class="text-danger">${formatarMoeda(consumo.valor)}</td>
                    <td>
                        <button onclick="excluirConsumo(${consumo.id})" class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button>
                    </td>
                `;
            });

            if (consumosFiltrados.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Nenhum uso de crédito registrado com os filtros aplicados.</td></tr>`;
            }
        }
        
        function excluirConsumo(consumoId) {
            const consumoIndex = consumos.findIndex(c => c.id === consumoId);
            if (consumoIndex > -1) {
                const consumo = consumos[consumoIndex];
                const consignatario = clientes.find(c => c.id === consumo.consignatarioId);

                if (confirm(`Tem certeza que deseja excluir este consumo de ${formatarMoeda(consumo.valor)}? O valor será adicionado de volta ao saldo do consignatário.`)) {
                    
                    // 1. REVERTER CRÉDITO
                    if (consignatario) {
                        consignatario.creditos += consumo.valor;
                    }
                    
                    // 2. REMOVER CONSUMO
                    consumos.splice(consumoIndex, 1);
                    salvarDados();
                    mostrarNotificacao('Consumo excluído e saldo revertido com sucesso!', 'sucesso');
                    
                    // Re-renderização
                    atualizarSaldoConsignatario();
                    renderizarConsumos();
                    atualizarListaConsignatarios(); 
                    renderizarDashboard();
                }
            }
        }
        
        function limparFiltrosConsumos() {
            document.getElementById('filtroConsignatarioConsumo').value = '';
            document.getElementById('filtroDataInicialConsumo').value = '';
            document.getElementById('filtroDataFinalConsumo').value = '';
            renderizarConsumos();
        }

        // ========================================
        // DASHBOARD
        // ========================================
        
        function renderizarDashboard() {
            // Carrega opções de filtro para o Dashboard
            carregarOpcoesBazares(true); 
            carregarOpcoesConsignatarios(true);

            // Coleta filtros
            const filtroBazarId = document.getElementById('filtroBazarDashboard').value;
            const filtroConsignatarioId = document.getElementById('filtroConsignatarioDashboard').value;
            const filtroMes = document.getElementById('filtroMesDashboard').value; 

            let vendasFiltradas = vendas;

            // Filtra Vendas
            if (filtroBazarId) vendasFiltradas = vendasFiltradas.filter(v => v.bazarVendaId === parseInt(filtroBazarId));
            
            if (filtroConsignatarioId) {
                vendasFiltradas = vendasFiltradas.filter(v => {
                    const item = itens.find(i => i.id === v.itemId);
                    return item && item.consignatarioId === parseInt(filtroConsignatarioId);
                });
            }
            // Filtro por Mês 
            if (filtroMes) {
                vendasFiltradas = vendasFiltradas.filter(v => {
                    return new Date(v.dataVenda).getMonth() + 1 === parseInt(filtroMes);
                });
            }


            // CÁLCULOS
            const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.valorVenda, 0);
            const creditosGerados = vendasFiltradas.reduce((acc, v) => acc + v.creditoGerado, 0);
            const comissaoTotalLoja = vendasFiltradas.reduce((acc, v) => acc + v.comissaoLoja, 0);
            
            // Créditos Ativos: Soma de todos os saldos dos consignatários
            const creditosAtivos = clientes.reduce((acc, c) => acc + (c.creditos > 0 ? c.creditos : 0), 0);
            
            // Créditos Utilizados (Consumos): Usamos o array global, pois o filtro de vendas não se aplica a consumos
            const creditosUtilizados = consumos.reduce((acc, c) => acc + c.valor, 0);
            
            const itensEmEstoque = itens.filter(i => i.status === 'Disponível' && i.quantidade > 0).reduce((acc, i) => acc + i.quantidade, 0);

            // ATUALIZA CARDS
            document.getElementById('totalVendasDashboard').textContent = formatarMoeda(totalVendas);
            document.getElementById('creditosGeradosDashboard').textContent = formatarMoeda(creditosGerados);
            document.getElementById('comissaoLojaDashboard').textContent = formatarMoeda(comissaoTotalLoja);
            document.getElementById('creditosUtilizadosDashboard').textContent = formatarMoeda(creditosUtilizados);
            document.getElementById('creditosAtivosDashboard').textContent = formatarMoeda(creditosAtivos);
            document.getElementById('itensEmEstoqueDashboard').textContent = itensEmEstoque.toString();

            // ATUALIZA TABELA DE ÚLTIMAS VENDAS
            const tbody = document.getElementById('ultimasVendasTable').querySelector('tbody');
            tbody.innerHTML = '';
            const ultimasVendas = vendasFiltradas.sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda)).slice(0, 5);

            ultimasVendas.forEach(venda => {
                const comprador = compradores.find(c => c.id === venda.compradorId);
                const bazar = bazares.find(b => b.id === venda.bazarVendaId);
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${new Date(venda.dataVenda).toLocaleDateString('pt-BR')}</td>
                    <td>${comprador ? comprador.nome : 'N/A'}</td>
                    <td>${bazar ? bazar.nome : 'N/A'}</td>
                    <td>${formatarMoeda(venda.valorVenda)}</td>
                `;
            });
            if (ultimasVendas.length === 0) {
                 tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhuma venda recente.</td></tr>`;
            }
        }
        
        // ========================================
        // RELATÓRIOS (NOVO)
        // ========================================
        function gerarRelatorio() {
            const tipo = document.getElementById('tipoRelatorio').value;
            const periodo = document.getElementById('periodoRelatorio').value.trim();
            const previewArea = document.getElementById('relatorioPreview');
            previewArea.innerHTML = '';

            if (tipo === 'vendas_consignatario') {
                gerarRelatorioVendasConsignatario(previewArea, periodo);
            } else if (tipo === 'creditos_ativos') {
                gerarRelatorioCreditosAtivos(previewArea);
            } else if (tipo === 'movimentacao_caixa') {
                 gerarRelatorioMovimentacaoCaixa(previewArea, periodo);
            }

            // Exemplo de como você chamaria o JS-PDF aqui:
            // const doc = new window.jspdf.jsPDF();
            // doc.text(`Relatório de ${tipo}`, 10, 10);
            // doc.save(`${tipo}_${periodo || 'geral'}.pdf`);
            mostrarNotificacao('Relatório gerado! (O PDF real precisaria de uma biblioteca configurada para salvar o arquivo)', 'sucesso');
        }

        function gerarRelatorioVendasConsignatario(previewArea, periodo) {
            const vendasPorConsignatario = {};

            vendas.forEach(v => {
                const item = itens.find(i => i.id === v.itemId);
                if (!item) return;

                const consignatario = clientes.find(c => c.id === item.consignatarioId);
                const nome = consignatario ? consignatario.nome : 'Consignatário Excluído';

                if (!vendasPorConsignatario[nome]) {
                    vendasPorConsignatario[nome] = { totalVendas: 0, totalCredito: 0, totalItens: 0 };
                }

                vendasPorConsignatario[nome].totalVendas += v.valorVenda;
                vendasPorConsignatario[nome].totalCredito += v.creditoGerado;
                vendasPorConsignatario[nome].totalItens += 1;
            });
            
            const sorted = Object.entries(vendasPorConsignatario).sort(([, a], [, b]) => b.totalVendas - a.totalVendas);
            
            let html = `<h4>Relatório de Vendas por Consignatário (Período: ${periodo || 'Geral'})</h4>`;
            html += `<table class="data-table">
                        <thead>
                            <tr>
                                <th>Consignatário</th>
                                <th>Total de Vendas</th>
                                <th>Crédito Gerado</th>
                                <th>Itens Vendidos</th>
                            </tr>
                        </thead>
                        <tbody>`;

            sorted.forEach(([nome, dados]) => {
                html += `<tr>
                            <td>${nome}</td>
                            <td>${formatarMoeda(dados.totalVendas)}</td>
                            <td>${formatarMoeda(dados.totalCredito)}</td>
                            <td>${dados.totalItens}</td>
                        </tr>`;
            });

            html += `<tr>
                        <td class="text-info"><strong>TOTAL GERAL</strong></td>
                        <td class="text-info"><strong>${formatarMoeda(vendas.reduce((acc, v) => acc + v.valorVenda, 0))}</strong></td>
                        <td class="text-info"><strong>${formatarMoeda(vendas.reduce((acc, v) => acc + v.creditoGerado, 0))}</strong></td>
                        <td class="text-info"><strong>${vendas.length}</strong></td>
                    </tr>`;

            html += `</tbody></table>`;
            previewArea.innerHTML = html;
        }

        function gerarRelatorioCreditosAtivos(previewArea) {
             const html = `
                <h4>Relatório de Saldos de Crédito Ativos</h4>
                <p>Este relatório mostra o saldo atual de cada consignatário.</p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Consignatário</th>
                            <th>Saldo de Crédito</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.sort((a, b) => b.creditos - a.creditos).map(c => `
                            <tr>
                                <td>${c.id}</td>
                                <td>${c.nome}</td>
                                <td class="${(c.creditos || 0) < 0 ? 'text-danger' : 'text-success'}">${formatarMoeda(c.creditos)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            previewArea.innerHTML = html;
        }

        function gerarRelatorioMovimentacaoCaixa(previewArea, periodo) {
            const totalComissao = vendas.reduce((acc, v) => acc + v.comissaoLoja, 0);
            const totalConsumo = consumos.reduce((acc, c) => acc + c.valor, 0);
            
            // Simplificado: Assumindo que Consumos são Pagamentos/Saídas do caixa da loja
            // E Comissões são Entradas
            
            const saldoCaixa = totalComissao - totalConsumo;

            const html = `
                <h4>Relatório de Movimentação de Caixa da Loja (Período: ${periodo || 'Geral'})</h4>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Métrica</th>
                            <th>Valor</th>
                            <th>Tipo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Comissão (Lucro Bruto de Vendas)</td><td>${formatarMoeda(totalComissao)}</td><td class="text-success">Entrada</td></tr>
                        <tr><td>Uso de Crédito (Saídas p/ Consignatário)</td><td>${formatarMoeda(totalConsumo)}</td><td class="text-danger">Saída</td></tr>
                        <tr><td><strong>SALDO DE CAIXA (Líquido)</strong></td><td class="${saldoCaixa >= 0 ? 'text-success' : 'text-danger'}"><strong>${formatarMoeda(saldoCaixa)}</strong></td><td></td></tr>
                    </tbody>
                </table>
            `;
            previewArea.innerHTML = html;
        }


        // ========================================
        // INICIALIZAÇÃO DO APP
        // ========================================

        document.addEventListener('DOMContentLoaded', () => {
            carregarDados();
            checkInitializers();

            // Adiciona o listener para importação
            document.getElementById('importFile').addEventListener('change', processarImportacao);

            // Atalhos de teclado
            document.addEventListener('keydown', function(e) {
                // Ctrl+S para salvar (Cadastrar)
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
                    } else if (tabAtiva === 'vendas') {
                        registrarVenda();
                    } else if (tabAtiva === 'consumos') {
                        registrarConsumo();
                    } else if (tabAtiva === 'config') {
                        salvarConfiguracoes();
                    }
                }
                // Ctrl+E para exportar
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    exportarDados();
                }
            });
        });
