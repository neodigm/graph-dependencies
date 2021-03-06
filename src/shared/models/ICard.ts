interface ICard {
  id?: string;
  cardElement?: Element;
  href: string;
  cardNumber: string;
  cardName: string;
  labels: Array<{
    classes: string;
    text: string;
    color: string;
  }>;
  button?: HTMLButtonElement;
  listName: string;
  children: Set<string>;
  dependencies: Set<string>;
  members?: string[];
  ticketDifficulty?: string;
}
