import React, { useState, useEffect } from 'react';

// URL do Google Apps Script (Substitua pela sua URL real)
const GAS_URL = "COLE_AQUI_A_URL_DO_SEU_WEB_APP_DO_APPS_SCRIPT";

const CLIMA_OPCOES = [
    { id: 'ensolarado', label: 'Ensolarado', icon: '☀️' },
    { id: 'nublado', label: 'Nublado', icon: '☁️' },
    { id: 'chuvoso', label: 'Chuvoso', icon: '🌧️' },
    { id: 'tempestade', label: 'Tempestade', icon: '⛈️' }
];

const FASES_OBRA = [
    "Serviços Preliminares", "Fundações", "Estrutura", "Alvenaria", 
    "Cobertura", "Instalações Elétricas", "Instalações Hidráulicas", 
    "Acabamento", "Limpeza Final"
];

export default function App() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // Estado principal do formulário
    const [formData, setFormData] = useState({
        id: `RD${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        data: new Date().toISOString().split('T')[0],
        emailUsuario: '',
        clima: [],
        horaInicio: '07:00',
        horaFim: '17:00',
        faseAtual: '',
        maoDeObra: [],
        equipamentos: [],
        atividades: [],
        entregas: [],
        fotos: [], 
        anexos: [] 
    });

    // Carregar rascunho ao iniciar
    useEffect(() => {
        const draft = localStorage.getItem('diarioObraDraft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                setFormData({ ...parsed, fotos: [], anexos: [] }); 
            } catch (e) { console.error("Erro ao carregar rascunho"); }
        }
    }, []);

    // Salvar rascunho a cada mudança (exceto arquivos pesados)
    useEffect(() => {
        const draftToSave = { ...formData, fotos: [], anexos: [] };
        localStorage.setItem('diarioObraDraft', JSON.stringify(draftToSave));
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleClima = (id) => {
        setFormData(prev => {
            if (prev.clima.includes(id)) {
                return { ...prev, clima: prev.clima.filter(c => c !== id) };
            }
            if (prev.clima.length >= 2) return prev; // Máximo 2
            return { ...prev, clima: [...prev.clima, id] };
        });
    };

    // Funções genéricas para listas dinâmicas
    const addItem = (field, defaultObj) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], defaultObj] }));
    };

    const removeItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const updateItem = (field, index, key, value) => {
        setFormData(prev => {
            const newList = [...prev[field]];
            newList[index][key] = value;
            return { ...prev, [field]: newList };
        });
    };

    // Manipulação de Arquivos para Base64
    const handleFileUpload = (e, field) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({
                    name: file.name,
                    type: file.type,
                    base64: reader.result.split(',')[1]
                });
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
        })).then(base64Files => {
            setFormData(prev => ({
                ...prev,
                [field]: [...prev[field], ...base64Files]
            }));
        });
    };

    const removeFile = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!formData.emailUsuario || !formData.faseAtual) {
            setMessage({ text: 'Preencha os campos obrigatórios (E-mail e Fase).', type: 'error' });
            window.scrollTo(0,0);
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: 'A enviar relatório e a gerar PDF...', type: 'info' });

        try {
            await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            setMessage({ text: 'Diário enviado com sucesso! Uma cópia será enviada para o seu e-mail.', type: 'success' });
            localStorage.removeItem('diarioObraDraft'); 
            
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error("Erro no envio", error);
            setMessage({ text: 'Erro ao enviar. Verifique a sua ligação à internet.', type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 font-sans bg-gray-50 min-h-screen text-gray-800">
            {/* CABEÇALHO */}
            <header className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-8 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Diário de Obra</h1>
                    <p className="text-blue-100 mt-2 text-sm md:text-base font-medium">Preencha as informações diárias do canteiro de obras</p>
                </div>
                <div className="text-left md:text-right bg-black/20 p-4 rounded-lg backdrop-blur-sm w-full md:w-auto">
                    <p className="font-mono text-sm md:text-base mb-1">ID: <span className="font-bold text-white tracking-widest">{formData.id}</span></p>
                    <button 
                        type="button"
                        onClick={() => { localStorage.removeItem('diarioObraDraft'); window.location.reload(); }}
                        className="text-xs text-blue-200 hover:text-white underline transition-colors"
                    >
                        Limpar dados guardados
                    </button>
                </div>
            </header>

            {message.text && (
                <div className={`p-4 mb-8 rounded-lg border shadow-sm font-medium ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* DADOS GERAIS */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 p-2 rounded-md">📋</span> Dados Gerais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail do Responsável <span className="text-red-500">*</span></label>
                            <input type="email" name="emailUsuario" value={formData.emailUsuario} onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none" placeholder="seu@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Envio</label>
                            <input type="date" name="data" value={formData.data} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Início</label>
                            <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Horário de Término</label>
                            <input type="time" name="horaFim" value={formData.horaFim} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Fase atual da obra <span className="text-red-500">*</span></label>
                            <select name="faseAtual" value={formData.faseAtual} onChange={handleChange} required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none appearance-none">
                                <option value="">Selecione uma fase...</option>
                                {FASES_OBRA.map(fase => <option key={fase} value={fase}>{fase}</option>)}
                            </select>
                        </div>
                        
                        <div className="md:col-span-2 pt-4 border-t border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Condições Climáticas (Máx. 2)</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {CLIMA_OPCOES.map(op => (
                                    <div 
                                        key={op.id}
                                        onClick={() => toggleClima(op.id)}
                                        className={`p-4 border-2 rounded-xl cursor-pointer text-center transition-all duration-200 transform hover:-translate-y-1 ${formData.clima.includes(op.id) ? 'bg-blue-50 border-blue-500 shadow-md scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}
                                    >
                                        <div className="text-4xl mb-2 drop-shadow-sm">{op.icon}</div>
                                        <div className={`text-sm font-bold ${formData.clima.includes(op.id) ? 'text-blue-800' : 'text-gray-600'}`}>{op.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* MÃO DE OBRA */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-700 p-2 rounded-md">👷</span> Equipas / Mão de Obra
                        </h2>
                        <button type="button" onClick={() => addItem('maoDeObra', { funcao: '', quantidade: 1, tipo: 'Direta' })} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors w-full md:w-auto">+ Adicionar Profissional</button>
                    </div>
                    
                    {formData.maoDeObra.length === 0 && <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium">Nenhuma mão de obra adicionada. Clique no botão acima para inserir.</div>}
                    
                    <div className="space-y-4">
                        {formData.maoDeObra.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 items-center relative group">
                                <input type="text" placeholder="Função (ex: Engenheiro)" value={item.funcao} onChange={(e) => updateItem('maoDeObra', index, 'funcao', e.target.value)} className="w-full md:w-1/2 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                <input type="number" min="1" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem('maoDeObra', index, 'quantidade', e.target.value)} className="w-full md:w-24 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                <select value={item.tipo} onChange={(e) => updateItem('maoDeObra', index, 'tipo', e.target.value)} className="w-full md:w-1/3 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <option value="Direta">Direta</option>
                                    <option value="Indireta">Indireta</option>
                                </select>
                                <button type="button" onClick={() => removeItem('maoDeObra', index)} className="text-red-500 hover:bg-red-50 font-bold p-3 rounded-lg w-full md:w-auto transition-colors">Remover</button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* EQUIPAMENTOS */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-yellow-100 text-yellow-700 p-2 rounded-md">🚜</span> Equipamentos
                        </h2>
                        <button type="button" onClick={() => addItem('equipamentos', { equipamento: '', quantidade: 1, tipo: 'Alugado', obs: '' })} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors w-full md:w-auto">+ Adicionar Equipamento</button>
                    </div>
                    
                    {formData.equipamentos.length === 0 && <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium">Nenhum equipamento adicionado.</div>}
                    
                    <div className="space-y-4">
                        {formData.equipamentos.map((item, index) => (
                            <div key={index} className="flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input type="text" placeholder="Nome do Equipamento" value={item.equipamento} onChange={(e) => updateItem('equipamentos', index, 'equipamento', e.target.value)} className="w-full md:w-1/2 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    <input type="number" min="1" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem('equipamentos', index, 'quantidade', e.target.value)} className="w-full md:w-24 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    <select value={item.tipo} onChange={(e) => updateItem('equipamentos', index, 'tipo', e.target.value)} className="w-full md:w-1/4 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                        <option value="Próprio">Próprio</option>
                                        <option value="Alugado">Alugado</option>
                                    </select>
                                    <button type="button" onClick={() => removeItem('equipamentos', index)} className="text-red-500 hover:bg-red-50 font-bold p-3 rounded-lg hidden md:block transition-colors">Remover</button>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input type="text" placeholder="Observações..." value={item.obs} onChange={(e) => updateItem('equipamentos', index, 'obs', e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    <button type="button" onClick={() => removeItem('equipamentos', index)} className="text-red-500 bg-red-50 font-bold p-3 rounded-lg md:hidden">Remover Item</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ATIVIDADES */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 p-2 rounded-md">🛠️</span> Atividades e Ocorrências
                        </h2>
                        <button type="button" onClick={() => addItem('atividades', { etapa: formData.faseAtual, descricao: '', ocorrencias: '' })} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors w-full md:w-auto">+ Adicionar Atividade</button>
                    </div>
                    
                    {formData.atividades.length === 0 && <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium">Nenhuma atividade descrita para o dia.</div>}
                    
                    <div className="space-y-6">
                        {formData.atividades.map((item, index) => (
                            <div key={index} className="flex flex-col gap-4 bg-white p-5 rounded-xl border-2 border-gray-100 shadow-sm relative">
                                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                    <input type="text" placeholder="Etapa (Ex: Fundações)" value={item.etapa} onChange={(e) => updateItem('atividades', index, 'etapa', e.target.value)} className="w-2/3 p-2 bg-transparent text-lg font-bold outline-none border-b-2 border-transparent focus:border-blue-500" />
                                    <button type="button" onClick={() => removeItem('atividades', index)} className="text-red-500 hover:bg-red-50 p-2 rounded text-sm font-bold transition-colors">Apagar</button>
                                </div>
                                <textarea placeholder="Descrição detalhada das atividades realizadas hoje..." value={item.descricao} onChange={(e) => updateItem('atividades', index, 'descricao', e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px]"></textarea>
                                <textarea placeholder="Ocorrências / Interferências (Opcional)" value={item.ocorrencias} onChange={(e) => updateItem('atividades', index, 'ocorrencias', e.target.value)} className="w-full p-4 bg-orange-50/50 border border-orange-100 rounded-lg outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"></textarea>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ENTREGAS */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 p-2 rounded-md">📦</span> Entregas e Recebimentos
                        </h2>
                        <button type="button" onClick={() => addItem('entregas', { pedido: '', item: '', qtd: '', fornecedor: '' })} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm transition-colors w-full md:w-auto">+ Registar Entrega</button>
                    </div>
                    
                    {formData.entregas.length === 0 && <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 font-medium">Nenhum material recebido hoje.</div>}
                    
                    <div className="space-y-4">
                        {formData.entregas.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <input type="text" placeholder="Nº Pedido/NF" value={item.pedido} onChange={(e) => updateItem('entregas', index, 'pedido', e.target.value)} className="w-full md:w-1/5 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm" />
                                <input type="text" placeholder="Descrição do Item" value={item.item} onChange={(e) => updateItem('entregas', index, 'item', e.target.value)} className="w-full md:w-2/5 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Quantidade" value={item.qtd} onChange={(e) => updateItem('entregas', index, 'qtd', e.target.value)} className="w-full md:w-1/5 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                <input type="text" placeholder="Fornecedor" value={item.fornecedor} onChange={(e) => updateItem('entregas', index, 'fornecedor', e.target.value)} className="w-full md:w-1/5 p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                <button type="button" onClick={() => removeItem('entregas', index)} className="text-red-500 bg-red-50 hover:bg-red-100 font-bold p-3 rounded-lg transition-colors md:px-4">Remover</button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ARQUIVOS: FOTOS E ANEXOS */}
                <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* FOTOS */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 p-2 rounded-md">📷</span> Relatório Fotográfico
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">Imagens (.jpg, .png) incluídas no PDF final.</p>
                        </div>
                        
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-blue-50 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {/* SVG COM TAMANHO FIXO E SEGURO */}
                                <svg width="40" height="40" className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-1 text-sm text-gray-600"><span className="font-bold text-blue-600">Clique para selecionar</span> ou arraste</p>
                            </div>
                            {/* INPUT FORÇADO A FICAR INVISÍVEL */}
                            <input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={(e) => handleFileUpload(e, 'fotos')} />
                        </label>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {formData.fotos.map((foto, index) => (
                                <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm border border-gray-200 aspect-square bg-gray-200">
                                    <img src={`data:${foto.type};base64,${foto.base64}`} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button type="button" onClick={() => removeFile('fotos', index)} className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg">X</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ANEXOS DOCS */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="bg-indigo-100 text-indigo-700 p-2 rounded-md">📎</span> Anexos Fiscais
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">Notas fiscais ou projetos (PDFs, Imagens).</p>
                        </div>
                        
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-indigo-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-indigo-50 transition-all group">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {/* SVG COM TAMANHO FIXO E SEGURO */}
                                <svg width="40" height="40" className="text-indigo-500 mb-3 group-hover:scale-110 transition-transform" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                </svg>
                                <p className="mb-1 text-sm text-gray-600"><span className="font-bold text-indigo-600">Clique para selecionar</span> ou arraste</p>
                            </div>
                            {/* INPUT FORÇADO A FICAR INVISÍVEL */}
                            <input type="file" style={{ display: 'none' }} accept=".pdf,image/*" multiple onChange={(e) => handleFileUpload(e, 'anexos')} />
                        </label>

                        <div className="mt-6 space-y-3">
                            {formData.anexos.map((anexo, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-xl">📄</span>
                                        <span className="truncate text-sm font-medium text-gray-700">{anexo.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFile('anexos', index)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded font-bold transition-colors ml-2">X</button>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                {/* SUBMIT BUTTON - BARRA FLUTUANTE */}
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 hidden md:flex">
                            <span className="text-green-500">✓</span>
                            <span className="text-sm font-medium text-gray-600">O seu rascunho é guardado de forma segura no dispositivo.</span>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full md:w-auto px-10 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed hover:translate-y-0 shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30'}`}
                        >
                            {isSubmitting ? 'A processar e enviar...' : '✅ Finalizar e Gerar PDF'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}