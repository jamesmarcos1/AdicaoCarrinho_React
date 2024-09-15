import React, { Component } from 'react';
import API_CONSORCIO from '../../api';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Link } from 'react-router-dom';
import COLOR_PICKER_JSX from '../../components/ColorPicker';
import history from '../../history';

import XLSX from 'xlsx';
import { RadioButton } from 'primereact/radiobutton';

import { locale, addLocale } from 'primereact/api';
addLocale('ptbr', {
	startsWith: 'Começa com',
	contains: 'Contém',
	notContains: 'Não contém',
	endsWith: 'Termina com',
	equals: 'Igual',
	notEquals: 'Não igual',
	noFilter: 'Sem Filtro',
	lt: 'Menor que',
	lte: 'Menor ou igual',
	gt: 'Maior que',
	gte: 'Maior ou igual',
	dateIs: 'Data é',
	dateIsNot: 'Data não é',
	dateBefore: 'Antes da data',
	dateAfter: 'Depois da data',
	custom: 'Custom',
	clear: 'Limpar',
	apply: 'Filtrar',
	matchAll: 'Combinar Regras',
	matchAny: 'Pelo Menos Uma',
	addRule: 'Ad. Regra',
	removeRule: 'Del. Regra',
});

locale('ptbr');

const FORMATAR_CEDULA = (valor) =>
	!valor
		? valor
		: valor
				.toFixed(0)
				.replace(/\./g, ',')
				.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const CONVERTER_CEDULA = (rowData, { field }) => (!rowData[field] || rowData[field] === 0 ? null : FORMATAR_CEDULA(rowData[field]));

class CotacaoConsorcio extends Component {
	constructor() {
		super();
		this.state = {
			name: '',
			nameMCI: '',
			lanceMinAtual: 'Lance Min. Atual',
			lanceMenosUm: 'Lance Min. Menos 1',
			lanceMenosDois: 'Lance Min. Menos 2',
			totalCars2: 0,
			display: false,
			displayPopUp: true,
			name2: '',
			first: 0,
			first3: 0,
			loading: false,
			rows: 250,
			rows3: 4,
			radioTaxa: 1,
			mostrarBens: false,
			showMyComponent: false,
			showMyComponent2: false,
			agenciaPesquisada: 999991,
			city: {},
			city2: { id: 2, name: '2' },
			selectedCar: null,
			consultaPrefixoAgencia: {},
			fundoTabela: {},
			cities: [],
			cities2: [
				{ label: 'Prefixo Super Regional', value: { id: 1, name: '1' } },
				{ label: 'Prefixo Agência', value: { id: 2, name: '2' } },
			],
			cart: [],
		};

		this.onCityChange = this.onCityChange.bind(this);
		this.onCityChange2 = this.onCityChange2.bind(this);
		this.onRadioTaxaChange = this.onRadioTaxaChange.bind(this);
		this.onPageChange = this.onPageChange.bind(this);
		this.onPageChange3 = this.onPageChange3.bind(this);
		this.showSuccess = this.showSuccess.bind(this);
		this.onExport = this.onExport.bind(this);
	}

	onRadioTaxaChange(e) {
		this.setState({ radioTaxa: e.value });
	}

	templateCD_PRF_RSTD = (rowData, _) => (rowData.CD_PRF_RSTD === null ? rowData.CD_PRF_RSTD : rowData.CD_PRF_RSTD);

	onCityChange(e) {
		this.setState({ city: e.value });
	}
	onCityChange2(e) {
		this.setState({ city2: e.value });
	}

	_modificaPrefixoPesquisado(texto) {
		this.props.modificaPrefixoPesquisado(texto);
	}

	_modificaPrefixoPesquisado2(texto) {
		this.props.modificaPrefixoPesquisado2(texto);
	}

	componentDidMount() {
		this.getMARGEM();
		this.loguser();
		// this.msgs1.show([
		// 	{
		// 		severity: 'warn',
		// 		detail: 'Contratação de consórcio com instabilidade. Demanda já em tratamento pelo suporte especializado.',
		// 		sticky: true,
		// 		closable: false,
		// 	},
		// ]);
	}

	loguser = () => {
		API_CONSORCIO.get(`loguser/gruposativos/${null}`)
			.then((_) => null)
			.catch(({ message }) => console.log('ERRO:', message));
	};

	botaoFiltro = () => {
		this.setState({ loading: true });
		this.getMARGEM();
	};

	getMARGEM = () => {
		this.setState({
			resultado: {},
			cars2: [{}],
			totalCars2: 0,
			cars3: [{}],
			showMyComponent: false,
			showMyComponent2: false,
		});
		this.setState({ agenciaPesquisada: this.state.name });

		API_CONSORCIO.get('grupos/listargrupos/').then(({ data }) => {
			this.setState({ resultado: data, first: 0, rows: 250, loading: false }, () => {
				if (this.state.resultado && this.state.resultado.sucesso) {
					const CARACTERISTICAS = this?.state?.resultado?.resultado
						?.filter(({ caracteristica }) => caracteristica !== null)
						.map(({ cor, caracteristica }) => ({ cor, caracteristica }));

					const CARACTERISTICAS_UNICAS = [...new Map(CARACTERISTICAS.map((v) => [v.caracteristica, v])).values()];

					const CORES_CARACTERISTICAS =
						this.state.resultado.resultado !== undefined &&
						this.state.resultado.resultado
							.filter((item) => item.cor !== null)
							.map((item) => item.cor)
							.reduce((acc, itemAtual) => [...new Set([...acc, itemAtual])], [])
							.map((cor) => {
								const coresSemHashTag = String(cor).replace('#', '');
								const styleTag = document.createElement('style');

								styleTag.innerHTML = `.tabela-${coresSemHashTag} { background-color: ${cor} !important; }`;
								document.querySelector('head').appendChild(styleTag);

								return cor;
							});

					this.setState({
						CORES_CARACTERISTICAS: CORES_CARACTERISTICAS,
						CARACTERISTICAS_CADASTRADAS: CARACTERISTICAS_UNICAS,
						cars2: this.state.resultado.resultado,
						lanceMinAtual:
							'Lance Mín. ' +
							('0' + this.state.resultado.resultado[0].mes_ass1).slice(-2) +
							'/' +
							this.state.resultado.resultado[0].ano_ass1 +
							'*',
						lanceMenosUm:
							'Lance Mín. ' +
							('0' + this.state.resultado.resultado[0].mes_ass2).slice(-2) +
							'/' +
							this.state.resultado.resultado[0].ano_ass2 +
							'*',
						lanceMenosDois:
							'Lance Mín. ' +
							('0' + this.state.resultado.resultado[0].mes_ass3).slice(-2) +
							'/' +
							this.state.resultado.resultado[0].ano_ass3 +
							'*',
					});
				}
			});
		});

		API_CONSORCIO.get('grupos/dataatualizacao/').then(({ data }) => {
			this.setState({ resultadodois: data }, () => {
				if (this.state.resultadodois && this.state.resultadodois.sucesso)
					this.setState({
						dataAtualizacao: this.state.resultadodois.resultado[0].ATUALIZADO,
					});
			});
		});

		this.setState({ showMyComponent: true });
		setTimeout(() => this.setState({ loading: false }), 10000);
	};

	onPageChange(event) {
		this.setState({ first: event.first, rows: event.rows });
	}

	onPageChange3(event) {
		this.setState({ first3: event.first, rows3: event.rows });
	}

	calculateGroupTotal = () => {
		let total = 0;

		if (this.state.cars2) {
			for (let car of this.state.cars2) {
				total += car.VL_CPNT_RSTD;
			}
		}

		this.setState({
			totalCars2:
				'Total: R$ ' +
				total
					.toFixed(2)
					.toString()
					.replace(/\./g, ',')
					.replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
		});
	};

	clicarTabela = () => this.setState({ display: true });
	resetarTabela = () => this.dt.reset();

	clicarPainel = () => {
		if (this.state.selectedCar && this.state.selectedCar.CODIGO_GRUPO) {
			let grupo = this.state.selectedCar.CODIGO_GRUPO;

			history.push(`painellanceminimo/${grupo}`);
		}
	};

	clicarCalculadora = () => {
		if (this.state.selectedCar && this.state.selectedCar.CODIGO_GRUPO) {
			let grupo = this.state.selectedCar.CODIGO_GRUPO;

			history.push(`calculadoraparcelas/${grupo}`);
		}
	};

	mostrarBens = () => {
		this.setState({ cars277: [{}] });
		if (this.state.selectedCar && this.state.selectedCar.CODIGO_GRUPO) {
			let grupo = this.state.selectedCar.CODIGO_GRUPO;

			API_CONSORCIO.get(`grupos/listarbensgrupos/${grupo}`).then(({ data }) => {
				this.setState({ resultadosete: data }, () => {
					if (this.state.resultadosete && this.state.resultadosete.sucesso) {
						console.log(this.state.resultadosete.resultado);
						this.setState({
							cars277: this.state.resultadosete.resultado,
							mostrarBens: true,
						});
					}
				});
			});
		}
	};

	templateVALOR_BEM = (rowData, _) =>
		!rowData.VALOR_BEM || rowData.VALOR_BEM == 0
			? null
			: rowData.VALOR_BEM.toFixed(2)
					.toString()
					.replace(/\./g, ',')
					.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	templateBEM_MAIOR_VALOR = (rowData, _) =>
		!rowData.BEM_MENOR_VALOR
			? rowData.BEM_MENOR_VALOR
			: rowData.BEM_MENOR_VALOR.toFixed(2)
					.toString()
					.replace(/\./g, ',')
					.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	templateBEM_MAIOR_VALOR = (rowData, _) =>
		!rowData.BEM_MAIOR_VALOR
			? rowData.BEM_MAIOR_VALOR
			: rowData.BEM_MAIOR_VALOR.toFixed(2)
					.toString()
					.replace(/\./g, ',')
					.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	templateTX_ADM_GERAL = (rowData, _) => rowData.TX_ADM_GERAL.toFixed(2);
	templateTX_ADM_SERVIDOR = (rowData, _) => rowData.TX_ADM_SERVIDOR.toFixed(2);
	templateTX_ADM_FUNCI = (rowData, _) => rowData.TX_ADM_FUNCI.toFixed(2);

	templateperc_ass1 = (rowData, column) => {
		if (!rowData.perc_ass1 || rowData.perc_ass1 == 0) {
			return null;
		}

		return rowData.perc_ass1.toFixed(2);
	};

	templateperc_ass2 = (rowData, column) => {
		if (!rowData.perc_ass2 || rowData.perc_ass2 == 0) {
			return null;
		}

		return rowData.perc_ass2.toFixed(2);
	};

	templateperc_ass3 = (rowData, column) => {
		if (!rowData.perc_ass3 || rowData.perc_ass3 == 0) {
			return null;
		}

		return rowData.perc_ass3.toFixed(2);
	};

	showSuccess() {
		this.messages.show({
			life: 7000,
			severity: 'info',
			summary: 'Clique em qualquer grupo para ver mais informações.',
			detail: '',
		});
	}

	keyPressed = (event) => event.key === 'Enter' && this.botaoFiltro();

	onExport() {
		var data = this.state.cars2.map(({ ID, ...rest }) => rest);
		var ws = XLSX.utils.json_to_sheet(data);
		var wb = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(wb, ws, 'GruposAtivos');
		XLSX.writeFile(wb, 'GruposAtivos.xlsx');
	}

	COLORIR_FUNDO_TABELA = (data) => {
		const obj = {};

		if (this.state.CORES_CARACTERISTICAS && data.cor !== null && data.cor != undefined) {
			this.state.CORES_CARACTERISTICAS.map((cor) => {
				const coresSemHashTag = String(cor).replace('#', '');

				obj['tabela-' + coresSemHashTag] = data.cor === cor;
			});
		}

		return obj;
	};

	addToCart(rowData) {
		let cart = [...this.state.cart];

		// Verifica
		if (!cart.some((item) => item.id === rowData.id)) {
			cart.push(rowData);
		} else {
			// Imprime uma mensagem informando que o item já está no carrinho
			console.log('Item já está no carrinho');
		}

		this.setState({ cart });
	}

	viewCart() {
		this.props.history.push('/carrinho');
	}

	render() {
		const TABELA_DE_CARACTERISTICAS = this?.state?.CARACTERISTICAS_CADASTRADAS?.map(({ cor, caracteristica }) => (
			<div
				style={{
					backgroundColor: cor,
					width: '210px',
					marginTop: '5px',
					fontWeight: 'bold',
				}}
			>
				- {caracteristica}
			</div>
		));

		return (
			<div className="p-grid p-fluid dashboard">
				<div className="p-col-12" style={this.state.showMyComponent ? {} : { display: 'none' }}>
					{/*<div style={{ margin: '0 auto', width: '95%' }}>
						<Messages ref={(el) => (this.msgs1 = el)} />
					</div>*/}
					<div className="card" style={{ marginLeft: '10px' }}>
						<h6>{this.state.dataAtualizacao && this.state.dataAtualizacao}</h6>

						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<div style={{ textAlign: 'left', width: '100px', margin: '5px' }}>
								<Button
									type="button"
									className="p-button-success"
									icon="pi pi-external-link"
									iconPos="left"
									label="Excel"
									onClick={this.onExport}
								/>
							</div>
							<div style={{ textAlign: 'left', width: '140px', margin: '5px' }}>
								<Button
									type="button"
									className="p-button-success"
									icon="pi pi-shopping-cart"
									iconPos="left"
									label={`Carrinho (${this.state.cart ? this.state.cart.length : 0})`}
									onClick={this.viewCart}
									style={{ marginLeft: '10px' }}
								/>
							</div>
							<div className="p-field-radiobutton">
								<RadioButton
									inputId="city1"
									name="city"
									value={1}
									onChange={(e) => this.onRadioTaxaChange(e)}
									checked={this.state.radioTaxa === 1}
									style={{ fontSize: '14px' }}
								/>
								<label htmlFor="city1" style={{ fontSize: '14px' }}>
									Taxa Adm. Geral
								</label>

								<RadioButton
									inputId="city2"
									name="city"
									value={2}
									onChange={(e) => this.onRadioTaxaChange(e)}
									checked={this.state.radioTaxa === 2}
									style={{ fontSize: '14px', marginLeft: '20px' }}
								/>
								<label htmlFor="city2" style={{ fontSize: '14px' }}>
									Taxa Adm. Servidor
								</label>

								<RadioButton
									inputId="city3"
									name="city"
									value={3}
									onChange={(e) => this.onRadioTaxaChange(e)}
									checked={this.state.radioTaxa === 3}
									style={{ fontSize: '14px', marginLeft: '20px' }}
								/>
								<label htmlFor="city3" style={{ fontSize: '14px' }}>
									Taxa Adm. Funci BB
								</label>
							</div>

							<div>
								<COLOR_PICKER_JSX grupos={this.state.cars2} />

								<Button
									type="button"
									icon="pi pi-filter-slash"
									label="Limpar Filtros"
									className="p-button-outlined"
									style={{ width: '150px', margin: '5px' }}
									onClick={this.resetarTabela}
								/>
							</div>
						</div>

						{this.state.radioTaxa === 1 && (
							<DataTable
								value={this.state.cars2}
								rowClassName={this.COLORIR_FUNDO_TABELA}
								emptyMessage="O banco de dados não retornou informações para esta pesquisa."
								responsive={true}
								paginator={true}
								first={this.state.first}
								globalFilter={this.state.globalFilter}
								onPage={(e) => this.onPageChange(e)}
								rows={this.state.rows}
								rowsPerPageOptions={[25, 50, 150, 250]}
								selection={this.state.selectedCar}
								ref={(element) => (this.dt = element)}
								filterDisplay="row"
								selectionMode="single"
								removableSort
								onSelectionChange={(e) => {
									this.setState({ selectedCar: e.value, mostrarBens: false }, () => this.clicarTabela());
								}}
							>
								<Column
									style={{
										textAlign: 'center',
										width: '0.5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={(rowData) => {
										return (
											<Button s label="" onClick={() => this.addToCart(rowData)}>
												{' '}
												<i className="pi pi-plus"></i>{' '}
											</Button>
										);
									}}
									header=""
								/>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="CODIGO_GRUPO"
									header="Grupo"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '15%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SEGMENTO"
									header="Segmento"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SITUACAO_GRUPO"
									header="Situação"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="VAGAS"
									header="Vagas"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="PRAZO_ATUAL"
									header="Prazo Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="vendas_grupo_mes_ant"
									header="Vendas Mês Anterior"
									sortable={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="vendas_grupo"
									header="Vendas Mês Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MENOR_VALOR"
									header="Menor Valor"
									sortable={true}
									body={CONVERTER_CEDULA}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MAIOR_VALOR"
									header="Maior Valor"
									sortable={true}
									body={CONVERTER_CEDULA}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '3%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="TX_ADM_GERAL"
									header="Tx. Adm. Geral"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '3%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="FUNDO_RESERVA"
									header="Fundo Reserva"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="ATUALIZACAO"
									sortable={true}
									header="Atlz."
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass1"
									header={this.state.lanceMinAtual}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass1}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass2"
									header={this.state.lanceMenosUm}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass2}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass3"
									header={this.state.lanceMenosDois}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass3}
								/>
							</DataTable>
						)}

						{this.state.radioTaxa === 2 && (
							<DataTable
								value={this.state.cars2}
								rowClassName={this.COLORIR_FUNDO_TABELA}
								emptyMessage="O banco de dados não retornou informações para esta pesquisa."
								responsive={true}
								paginator={true}
								first={this.state.first}
								globalFilter={this.state.globalFilter}
								onPage={(e) => this.onPageChange(e)}
								rows={this.state.rows}
								rowsPerPageOptions={[25, 50, 150, 250]}
								selection={this.state.selectedCar}
								ref={(element) => (this.dt = element)}
								filterDisplay="row"
								selectionMode="single"
								removableSort
								onSelectionChange={(e) => {
									this.setState({ selectedCar: e.value, mostrarBens: false }, () => this.clicarTabela());
								}}
							>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="CODIGO_GRUPO"
									header="Grupo"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '15%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SEGMENTO"
									header="Segmento"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SITUACAO_GRUPO"
									header="Situação"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="VAGAS"
									header="Vagas"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="PRAZO_ATUAL"
									header="Prazo Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder=">="
									showFilterMenu={false}
									field="vendas_grupo_mes_ant"
									header="Vendas Mês Anterior"
									sortable={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="vendas_grupo"
									header="Vendas Mês Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MENOR_VALOR"
									header="Menor Valor"
									body={CONVERTER_CEDULA}
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MAIOR_VALOR"
									header="Maior Valor"
									body={CONVERTER_CEDULA}
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="TX_ADM_SERVIDOR"
									header="Tx. Adm. Serv."
									sortable={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '3%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="FUNDO_RESERVA"
									header="Fundo Reserva"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="ATUALIZACAO"
									sortable={true}
									header="Atlz."
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass1"
									header={this.state.lanceMinAtual}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass1}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass2"
									header={this.state.lanceMenosUm}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass2}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass3"
									header={this.state.lanceMenosDois}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass3}
								/>
							</DataTable>
						)}

						{this.state.radioTaxa === 3 && (
							<DataTable
								value={this.state.cars2}
								rowClassName={this.COLORIR_FUNDO_TABELA}
								emptyMessage="O banco de dados não retornou informações para esta pesquisa."
								responsive={true}
								paginator={true}
								first={this.state.first}
								globalFilter={this.state.globalFilter}
								onPage={(e) => this.onPageChange(e)}
								rows={this.state.rows}
								rowsPerPageOptions={[25, 50, 150, 250]}
								selection={this.state.selectedCar}
								ref={(element) => (this.dt = element)}
								filterDisplay="row"
								selectionMode="single"
								removableSort
								onSelectionChange={(e) => {
									this.setState({ selectedCar: e.value, mostrarBens: false }, () => this.clicarTabela());
								}}
							>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="CODIGO_GRUPO"
									header="Grupo"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.CONTAINS}
									style={{
										textAlign: 'center',
										width: '15%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SEGMENTO"
									header="Segmento"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="SITUACAO_GRUPO"
									header="Situação"
									sortable={true}
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="VAGAS"
									header="Vagas"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="PRAZO_ATUAL"
									header="Prazo Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder=">="
									showFilterMenu={false}
									field="vendas_grupo_mes_ant"
									header="Vendas Mês Anterior"
									sortable={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="vendas_grupo"
									header="Vendas Mês Atual"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MENOR_VALOR"
									header="Menor Valor"
									sortable={true}
									body={CONVERTER_CEDULA}
								/>
								<Column
									filterMatchMode={FilterMatchMode.GREATER_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder=">="
									showFilterMenu={false}
									showClearButton={false}
									field="BEM_MAIOR_VALOR"
									header="Maior Valor"
									sortable={true}
									body={CONVERTER_CEDULA}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="TX_ADM_FUNCI"
									header="Tx. Adm. Funci BB"
									sortable={true}
									style={{
										textAlign: 'center',
										width: '6%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									style={{
										textAlign: 'center',
										width: '3%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="FUNDO_RESERVA"
									header="Fundo Reserva"
									sortable={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.STARTS_WITH}
									style={{
										textAlign: 'center',
										width: '2%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									showFilterMenu={false}
									showClearButton={false}
									field="ATUALIZACAO"
									sortable={true}
									header="Atlz."
									filter={true}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass1"
									header={this.state.lanceMinAtual}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass1}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass2"
									header={this.state.lanceMenosUm}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass2}
								/>
								<Column
									filterMatchMode={FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
									filter={true}
									filterPlaceholder="<="
									showFilterMenu={false}
									showClearButton={false}
									field="perc_ass3"
									header={this.state.lanceMenosDois}
									sortable={true}
									style={{
										textAlign: 'center',
										width: '5%',
										padding: '1px 0',
										paddingRight: '1px',
										fontSize: '13px',
									}}
									body={this.templateperc_ass3}
								/>
							</DataTable>
						)}

						{TABELA_DE_CARACTERISTICAS}

						<div>Observações:</div>
						<div>- Clique em qualquer grupo para ver mais informações.</div>
						<div>
							- Verifique a disponibilidade do grupo de interesse nos canais de contratação antes de ofertar ao cliente.
						</div>
						<div>*Menor lance contemplado na assembleia do mês.</div>

						<div>
							**Servidores públicos das esferas municipal, estadual e federal - MCI's pagadores cadastrados no convênio 197082
							(clientes elegíveis apresentam taxa diferenciada, de forma automática, no momento da simulação nos canais de
							contratação).
						</div>
						<Dialog
							visible={false}
							modal={true}
							width="800px"
							onHide={() => {
								this.setState({
									displayPopUp: false,
								});
							}}
						>
							<Link to="/cotaai">
								<img
									style={{
										width: 'auto',
										height: '350px',
										borderRadius: '10px',
									}}
									alt="Cota Aí"
									src="https://consorcio.intranet.bb.com.br/apiconsorcio/arq/cotaai.png"
								></img>
							</Link>
						</Dialog>

						<Dialog
							header="Escolha uma opção"
							visible={this.state.display}
							modal={true}
							width="400px"
							onHide={() =>
								this.setState({
									display: false,
									selectedCar: null,
									mostrarBens: false,
								})
							}
						>
							<div className="card" style={{ width: '650px' }}>
								<div className="p-grid" style={{ justifyContent: 'center' }}>
									<div className="p-col-4" style={{ width: '200px' }}>
										{this.state.selectedCar && this.state.selectedCar.CODIGO_GRUPO && (
											<Link to={'/painellanceminimo/' + this.state.selectedCar.CODIGO_GRUPO}>
												<Button type="button" label="Painel Lance Mínimo" />
											</Link>
										)}
									</div>

									<div className="p-col-4" style={{ width: '200px' }}>
										{this.state.selectedCar && this.state.selectedCar.CODIGO_GRUPO && (
											<Link to={'/calculadoraparcelas/' + this.state.selectedCar.CODIGO_GRUPO}>
												<Button type="button" label="Calcular Parcelas" />
											</Link>
										)}
									</div>

									<div className="p-col-4" style={{ width: '200px' }}>
										<Button type="button" label="Mostrar Bens do Grupo" onClick={this.mostrarBens} />
									</div>
								</div>

								<div className="p-col-12" style={this.state.mostrarBens ? {} : { display: 'none' }}>
									<DataTable
										emptyMessage="O banco de dados não retornou informações para esta pesquisa."
										value={this.state.cars277}
										style={{ marginBottom: '10px' }}
										responsive={true}
										first="0"
										rows="500"
										scrollable={true}
										scrollHeight="160px"
									>
										<Column
											field="CODIGO_BEM"
											header="Código do Bem"
											style={{
												textAlign: 'center',
												fontSize: '9px',
												width: '50px',
											}}
										/>
										<Column
											field="NOME_BEM"
											header="Nome do Bem"
											style={{
												textAlign: 'center',
												fontSize: '9px',
												width: '100px',
											}}
										/>
										<Column
											field="VALOR_BEM"
											header="Valor (R$)"
											style={{
												textAlign: 'center',
												fontSize: '9px',
												width: '50px',
											}}
											body={this.templateVALOR_BEM}
										/>
									</DataTable>
								</div>
							</div>
						</Dialog>
					</div>
				</div>
			</div>
		);
	}
}

export default CotacaoConsorcio;
