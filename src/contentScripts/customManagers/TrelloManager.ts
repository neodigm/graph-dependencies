import { AbstractManager } from './AbstractManager';
import { TRELLO_LABEL_COLORS } from '../dependencyGraph/drawingHelper.constants';

export class TrelloManager extends AbstractManager {
  lists: IList[] = [];
  cardsById: Record<string, ICard> = {};
  insertElementForActionSelector = '.board-header';

  get cards() {
    return Object.values(this.cardsById);
  }

  getLists = (): IList[] => {
    return [...document.querySelectorAll('.js-list')].map((listElement) =>
      this.getListData(listElement),
    );
  };

  getListData = (list: Element): IList => {
    const listNameElement = list.querySelector('.list-header-name');
    return {
      name: listNameElement.innerHTML,
      listElement: list,
      actionInsertElement: listNameElement.parentElement,
    };
  };

  getCards = () => {
    return this.lists.reduce(
      (allCards, list) => [...allCards, ...this.getCardsFromList(list)],
      [],
    );
  };

  getCardsFromList = (list: IList) => {
    const cardElements = list.listElement.querySelectorAll(
      '.list-card.js-member-droppable',
    );
    return [...cardElements].map((cardElement) =>
      this.getCardDetails(cardElement, list.name),
    );
  };

  getCardDetails = (cardElement: Element, listName: string) => {
    const href = cardElement.getAttribute('href');
    const [_, prefix, cardId, cardNumberAndName] = href
      ? href.split('/')
      : ['', '', 'noCardSlug', 'noNumber - noName'];
    const [cardNumber, ...remainingUrl] = cardNumberAndName.split('-');
    let ticketDifficulty = '';
    try {
      if (parseInt(remainingUrl[0], 10)) {
        ticketDifficulty = '' + parseInt(remainingUrl[0], 10);
      }
    } catch (e) {}

    const rawCardName =
      cardElement.querySelector<HTMLInputElement>('.list-card-title')
        ?.innerText || '';

    let cardName = '';
    if (rawCardName) {
      const nameWithoutCardNumber = rawCardName
        .split(/^#(\d+)\s+/)
        .filter((x) => x);
      const cardNameAndTicketDifficulty = nameWithoutCardNumber[
        nameWithoutCardNumber.length - 1
      ]
        .split(/^\((\d+)\)\s*/)
        .filter((x) => x);
      ticketDifficulty =
        ticketDifficulty ||
        (cardNameAndTicketDifficulty.length === 2
          ? cardNameAndTicketDifficulty[0]
          : '');

      cardName =
        cardNameAndTicketDifficulty[cardNameAndTicketDifficulty.length - 1];
    }

    const labels = [...cardElement.querySelectorAll('.card-label')].map(
      (labelElement) => {
        const classes = labelElement.getAttribute('class');
        return {
          classes,
          text: labelElement.querySelector('.label-text').innerHTML,
          color: Object.keys(TRELLO_LABEL_COLORS).reduce(
            (final, cur) => (classes.includes(cur) ? cur : final),
            '',
          ),
        };
      },
    );

    const members = [
      ...cardElement.querySelectorAll('.member-initials'),
      ...cardElement.querySelectorAll('.member-avatar'),
    ].map((memberElement) => memberElement.getAttribute('title').split(' ')[0]);

    const card: ICard = {
      id: cardId,
      href,
      cardNumber,
      cardName,
      labels,
      listName,
      children: new Set(),
      dependencies: new Set(),
      cardElement,
      members,
      ticketDifficulty,
    };
    return card;
  };
}

console.info('[GRAPH DEP EXTENSION] :  injected trello manager');
(window as any).cardManager = new TrelloManager();
