// const readline = require('readline-sync');

// const lookForBook = () => readline.question('Digite o nome de um livro: ');

// module.exports = { run: lookForBook };

const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

// const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

// const NEXT_ACTION_CHOICES = [
//   {
//     name: 'Voltar para o menu anterior',
//     value: 'back',
//   },
//   {
//     name: 'Buscar outro livro',
//     value: 'repeat',
//   },
//   {
//     name: 'Sair',
//     value: 'exit',
//   },
// ];

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

// const getBooksFromPage = (pageLink) =>
//   new Promise((resolve, reject) => {
//     superagent.get(pageLink).end((err, response) => {
//       if (err) return reject(err);

//       const books = response.body;
//       /* A documentação da API especifica que ela retorna um header chamado link,
//          que contém o link para a próxima página ou para a página anterior, se existir. */
//       const links = parseLinks(response.headers.link);

//       return resolve({ books, links });
//     });
//   });

const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return ({ books, links });
  } catch (err) {
    console.error(err);
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (books) => ({
  name: books.name,
  value: removePropertiesFromBooks(books),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};

/**
 * Recebe uma escolha realizada pelo usuário.
 * Essa escolha pode ser uma personagem, que será exibida na tela,
 * ou o nome de uma ação a ser realizada, como voltar para o menu anterior.
 * O segundo parâmetro recebe as funções responsáveis por exibir
 * uma página de personagens, e por voltar para o menu principal.
 * O segundo parâmetro também recebe os links para a próxima página anterior.
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links, pageLink }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList(goBackToBooksMenu, `https://www.anapioficeandfire.com/api/books?name=`);
};

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getCharactersFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goBackToCharactersMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */

const getBookName = async ({ message }) =>
inquirer
  .prompt({
    type: 'input',
    name: 'choice',
    message,
  })
  .then(({ choice }) => choice);

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const enterBookName = pageLink || await getBookName({ message: 'Digite o nome de um livro: ' });

  const BOOK_ENTERED_LINK = pageLink || `https://www.anapioficeandfire.com/api/books?name=${enterBookName}`;

  const { books, links } = await getBooksFromPage(BOOK_ENTERED_LINK);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  };

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({ message: MENU_MAIN_MESSAGE, choices });

  return handleUserChoice(userChoice,
    { goBackToBooksMenu, showBooksList, links },
  );
};

module.exports = { run: showBooksList };
// Code based on lib/menus/characters/actions/list.js
