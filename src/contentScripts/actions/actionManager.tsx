import React, { useRef, useEffect } from 'react';

import { ReactDOMAppendChild } from '../utils/customCreateElement';
import './action-buttons.css';
import { cardService } from '../modules/cards/card.service';
import { DependencyTag } from './components/DependencyTag';
import { dependencyManager } from '../dependencyGraph/dependencyManager';
import { AbstractManager } from '../customManagers/AbstractManager';
import { StorageService } from './storageService';
import { useDebounce } from '../utils/useDebounce';

declare var cardManager: AbstractManager;

class ActionsManager {
  areActionsFirstInitialized: boolean = false; // In order to refresh actions on cards on body changes with mutation observer
  dependencyCardId: string;
  selectedLists = new Set<string>();
  listColors: Record<string, string> = {};

  toggleList = (listName: string) => {
    this.selectedLists.has(listName)
      ? this.selectedLists.delete(listName)
      : this.selectedLists.add(listName);
    this.onListChange();
  };

  onListChange = () => {
    this.refreshListActions(cardManager.lists);
    this.saveData();
  };

  getCardsInSelectedLists = (
    cardsById: Record<string, ICard>,
    selectedList: Set<string>,
  ) =>
    selectedList.size
      ? Object.fromEntries(
          Object.entries(cardsById).filter(([_, card]) =>
            selectedList.has(card.listName),
          ),
        )
      : cardsById;

  saveData = (copyConfig = false) => {
    const dependencies = dependencyManager.getDependencies();
    if (Object.values(dependencies).length || this.selectedLists.size) {
      StorageService.saveLocalStorageConfiguration(
        {
          dependencies,
          selectedLists: Array.from(this.selectedLists),
          listColors: this.listColors,
        },
        copyConfig,
      );
    } else {
      alert('No dependencies found');
    }
  };

  addRefreshActionsButton = () => {
    const RefreshActionsButton = () => (
      <button onClick={() => this.initializeActions()}>Refresh actions</button>
    );
    const ShowDependenciesButton = () => (
      <button
        onClick={() => {
          dependencyManager.createDependencyGraph(
            this.getCardsInSelectedLists(
              cardManager.cardsById,
              this.selectedLists,
            ),
          );
        }}
      >
        Show dependencies
      </button>
    );
    const RestoreDependenciesButton = () => (
      <button
        onClick={() => {
          const configRetrievedString = prompt(
            'Veuillez entrer la configuration de restauration fournie svp',
          );
          if (configRetrievedString) {
            try {
              const config: IStorageData = JSON.parse(configRetrievedString);
              this.restoreConfiguraton(config);
            } catch (e) {
              alert('Invalid configuration, check JSON data please');
            }
          }
        }}
      >
        Restore config
      </button>
    );
    const CopyDependencies = () => (
      <button onClick={() => this.saveData(true)}>Copy config</button>
    );
    document
      .querySelectorAll('.refresh-action-div')
      .forEach((el) => el.remove());
    ReactDOMAppendChild(
      <>
        <RefreshActionsButton />
        <ShowDependenciesButton />
        <CopyDependencies />
        <RestoreDependenciesButton />
      </>,
      document.querySelector(cardManager.insertElementForActionSelector),
      { className: 'refresh-action-div' },
    );
  };

  restoreConfiguraton = ({
    dependencies,
    selectedLists,
    listColors,
  }: IStorageData) => {
    this.selectedLists = new Set(selectedLists);
    this.listColors = listColors || {};
    this.refreshListActions(cardManager.lists);
    dependencyManager.renderDependencies(dependencies);
    actionsManager.refreshCardsActions();
  };

  updateAfterDOMChanges = () => {
    if (!document.querySelector('.refresh-action-div')) {
      this.addRefreshActionsButton();
    }
    if (!this.areActionsFirstInitialized) {
      return;
    }
    if (
      cardManager.cards.length !==
      document.querySelectorAll('.card-actions').length
    ) {
      this.initializeActions();
    }
  };

  initializeActions = () => {
    this.areActionsFirstInitialized = true;
    document
      .querySelectorAll('.div-graph-dep-action')
      .forEach((el) => el.remove());
    this.addRefreshActionsButton();
    cardManager.refresh();
    this.restoreConfiguraton(StorageService.getLocalStorageConfiguration());
  };

  refreshListActions = (lists: IList[] = cardManager.lists) => {
    document.querySelectorAll('.list-actions').forEach((el) => el.remove());
    lists.forEach((list) => this.addActionButtonToList(list));
  };

  addActionButtonToList = (list: IList) => {
    const isListSelected = this.selectedLists.has(list.name);
    const ListDependenciesButton = () => {
      const initialColor = this.listColors[list.name] || '#ffffff';
      const [color, setColor] = React.useState(
        this.listColors[list.name] || '#ffffff',
      );
      const debouncedColor = useDebounce(color, 1200);
      useEffect(
        () => {
          if (debouncedColor !== initialColor) {
            this.listColors[list.name] = debouncedColor;
            this.refreshListActions();
          }
        },
        [debouncedColor], // Only call effect if debounced search term changes
      );
      return (
        <>
          <button
            className={isListSelected && 'selected'}
            id={list.name}
            onClick={() => {
              this.toggleList(list.name);
            }}
          >
            {isListSelected ? (
              <>
                LIST SELECTED{' '}
                <input
                  type='color'
                  className='list-actions-color-input'
                  onChange={(e) => setColor(e.target.value)}
                  value={this.listColors[list.name] || '#ffffff'}
                />
              </>
            ) : (
              'SELECT THIS LIST'
            )}
          </button>
        </>
      );
    };
    ReactDOMAppendChild(<ListDependenciesButton />, list.actionInsertElement, {
      className: `list-actions`,
    });
  };

  refreshCardsActions = (cards: ICard[] = cardManager.cards) => {
    cards.forEach((card) => this.addActionButtonToCard(card));
  };

  addActionButtonToCard = (card: ICard) => {
    const CardActionDiv = () => {
      const buttonRef = useRef();

      useEffect(() => {
        //@ts-ignore
        buttonRef.current.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onCardDependencyActionClick(card.id);
        });
      }, []);
      return (
        <div>
          <button
            id={card.id}
            ref={buttonRef}
            className={card.id === this.dependencyCardId && 'selected'}
          >
            {cardService.getCardDependencyText(this.dependencyCardId, card.id)}
          </button>
          {Array.from(card.dependencies).map((dependencyId) => (
            <DependencyTag
              key={cardManager.cardsById[dependencyId].id}
              card={cardManager.cardsById[dependencyId]}
              onClose={() => {
                cardManager.removeDependency(card.id, dependencyId);
                this.saveData();
                this.refreshCardsActions();
              }}
            />
          ))}
        </div>
      );
    };
    card.cardElement.querySelector('.card-actions')?.remove();
    ReactDOMAppendChild(<CardActionDiv />, card.cardElement, {
      className: `card-actions div-${card.id}`,
    });
  };

  onCardDependencyActionClick = (cardId: string) => {
    if (this.dependencyCardId === cardId || !cardId) {
      this.dependencyCardId = '';
    } else if (!this.dependencyCardId) {
      this.dependencyCardId = cardId;
    } else {
      cardManager.addDependency(this.dependencyCardId, cardId);
      this.saveData();
      this.dependencyCardId = '';
    }
    this.refreshCardsActions();
  };
}

export const actionsManager = new ActionsManager();
