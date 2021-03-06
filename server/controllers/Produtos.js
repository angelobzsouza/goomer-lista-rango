// Modules
const fs = require('fs')
const validacao = require('../validation/validacoes');
const multer = require('multer');

// Models
const Produto = require('../models/produto');

// Inicia as configurações de upload de imagem
const storage = multer.diskStorage({
	destination: (req, file, callback) => {
		callback(null, './uploads/');
	},
	filename: (req, file, callback) => {
		callback(null, new Date().toISOString() + file.originalname);
	}
});
const upload = multer({storage: storage});

//CRUD
const getProduct = (req, res) => {
	Produto.find({IDRestaurante: req.params.IDRestaurante}).
		then((produtos) => {
			res.status(200).send(produtos);
		})
		.catch((err) => {
			res.status(404).send({Erro: "Nenhum produto foi encontrado."});
		});
};

const createProduct = (req, res) => {
  upload.single("foto");
	// Se houver foto, adiciona o path do arquivo ao produto
	if (req.body.foto !== undefined) {
		req.body.foto = req.file.path;
	};

	// Se houver promocao
	if (req.body.promocao !== undefined) {
		// Se os horários forem válidos
		if (Array.isArray(req.body.promocao.diasPromocao) && validacao.validaDias(req.body.promocao.diasPromocao) && validacao.validaHorarios(req.body.promocao.diasPromocao)) {
			Produto.create(req.body)
				.then((restaurante) => {
					res.status(200).send(restaurante);
				})
				.catch((err) => {
					trataErros(err, res);
				});
		}
		// Caso os horário não sejam válidos
		else {
			res.status(400).send({
				Erro: `Horário/s de promocão inválido/s`
			})
		}
	}
	// Se não houver promocao
	else {
		Produto.create(req.body)
			.then((produto) => {
				res.status(200).send(produto);
			})
			.catch((err) => {
				trataErros(err, res);
			});
	}
};

const updateProduct = (req, res) => {
  upload.single("foto")
	// Se alguma foto estiver sendo enviada, busca o produto para apagar o arquivo antigo
	if (req.file !== undefined) {
		Produto.findOne({_id: req.params.IDProduto}).then((produto) => {
			if (produto.foto !== undefined) {
				fs.unlink(produto.foto, (err) => {
					if (err) console.log(err);
				})
			}
		});
		// Adiciona o nome da nova foto ao documento do restaurante e atualiza
		req.body.foto = req.file.path;
	}
	// Se houver promocao
	if (req.body.promocao !== undefined) {
		// Se os horários forem válidos
		if (Array.isArray(req.body.promocao.diasPromocao) && validacao.validaDias(req.body.promocao.diasPromocao) && validacao.validaHorarios(req.body.promocao.diasPromocao)) {
			Produto.findByIdAndUpdate({_id: req.params.IDProduto}, req.body)
				.then(() => {
					// Busca o produto atualizado
					Produto.findOne({_id: req.params.IDProduto}).then((produto) => {
						res.status(200).send(produto);
					});
				})
				.catch((err) => {
					trataErros(err, res);
				});
		// Caso os horário não sejam válidos
		}
		else {
			res.status(400).send({
				Erro: `Horário/s de promocão inválido/s`
			})
		}
	}
	// Se não houver promocao
	else {
		Produto.findByIdAndUpdate({_id: req.params.IDProduto}, req.body)
			.then(() => {
				// Busca o produto atualizado
				Produto.findOne({_id: req.params.IDProduto}).then((produto) => {
					res.status(200).send(produto);
				});
			})
			.catch((err) => {
				trataErros(err, res);
			});
	}
};

const deleteProduct = (req, res) => {
	Produto.findOne({_id: req.params.IDProduto})
		.then((produto) => {
			// Se o produto tiver uma foto salva no server, exclui o arquivo antes de apagar o produto
			if (produto.foto !== undefined) {
				// Se houver algum erro ao excluir o arquivo, apresenta o mesmo no console
				fs.unlink(produto.foto, (err) => {
					if (err) console.log(err);
				})
			}
		})
		.catch((er) => {
			res.status(400).send({Erro: "Produto não encontrado"});
		});

	Produto.findByIdAndRemove({_id: req.params.IDProduto})
		.then((produto) => {
			res.status(200).send(produto);
		})
		.catch((err) => {
			res.status(400).send({Erro: "Produto não encontrado"});
		});
};

// Funções
function trataErros (err, res) {
	var erros = [];
	Object.entries(err.errors).forEach(([key, value]) => {
		erros.push({
			Campo: key,
			Erro: value.message,
		})
	});
	res.status(400).send(erros); 
}

module.exports = { getProduct, createProduct, updateProduct, deleteProduct };