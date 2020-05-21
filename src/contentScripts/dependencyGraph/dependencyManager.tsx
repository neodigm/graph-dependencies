import React from 'react';
import { cardManager } from '../getTasks/trello/cardManager';
import { actionsManager } from '../actions/actionManager';
import { createDependencyGraph } from './createDependencyGraph';
import { ReactDOMAppendChild } from '../utils/customCreateElement';
import { calculateCardHeight } from './textWidthHelper';

class DependencyManager {
  getDependencies = (
    cardsById: Record<string, ICard> = cardManager.cardsById,
  ) => {
    return Object.entries(cardsById).reduce<{ [x: string]: string[] }>(
      (finalDependencies, [cardId, card]) => {
        if (card.children.size > 0) {
          return {
            ...finalDependencies,
            [cardId]: Array.from(card.children),
          };
        }
        return finalDependencies;
      },
      {},
    );
  };

  renderDependencies = (dependencyObj: DependencyGraph) => {
    Object.entries(dependencyObj).map(([parentId, childrenIds]) => {
      childrenIds.map((childId) => {
        if (cardManager.cardsById[parentId] && cardManager.cardsById[childId]) {
          cardManager.addDependency(childId, parentId);
        }
      });
    });
    actionsManager.refreshCardsActions();
  };

  generateDependencyTree = (cards: Record<string, ICard>) => {
    const cardIdsToKeep = new Set(Object.keys(cards));

    //Remove dependencies from cards when parent card is not in the list
    const cardDependencies = Object.values(cards).reduce<
      Record<string, CardDependency>
    >((finalCardDependencies, card) => {
      const cardDependencies = [
        ...card.dependencies,
      ].filter((dependencyCardId) => cardIdsToKeep.has(dependencyCardId));
      const cardChildren = [...card.children].filter((childCardId) =>
        cardIdsToKeep.has(childCardId),
      );
      finalCardDependencies[card.id] = {
        id: card.id,
        dependencies: cardDependencies,
        children: cardChildren,
      };
      return finalCardDependencies;
    }, {});

    return cardDependencies;
  };

  removeDependencyApp = () => {
    document.querySelector('#cy')?.remove();
  };

  generateDependencySection = () => {
    const DependencySection = () => (
      <div id='cy'>
        <div
          className='close-button'
          onClick={() => this.removeDependencyApp()}
        >
          Fermer
        </div>
      </div>
    );

    ReactDOMAppendChild(<DependencySection />, document.querySelector('body'), {
      insertAfter: true,
    });
  };

  createEdgeData = (sourceId: string, targetId: string) => ({
    id: `${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
  });

  computeNodesAndEdges = (cardsById: Record<string, ICard>) => {
    const cardDependencies = this.generateDependencyTree(cardsById);
    const allCards = Object.values(cardsById);
    const nodes = allCards.map((card) => {
      const completeCard = cardsById[card.cardUrl];
      return {
        data: {
          id: completeCard.id,
          ...completeCard,
          cardName: decodeURI(completeCard.cardName),
          label: decodeURI(
            [completeCard.cardNumber, completeCard.cardName].join(' '),
          ),
          height: calculateCardHeight(completeCard.cardName),
        },
        classes: 'center-center',
      };
    });
    const edges = allCards.reduce((final, card) => {
      final.push(
        ...[...card.children].map((childCardID: string) => ({
          data: this.createEdgeData(card.id, cardDependencies[childCardID].id),
        })),
      );
      return final;
    }, []);
    return { nodes, edges };
  };

  addDependency = (parentCardId: string, childCardId: string) => {
    return this.createEdgeData(parentCardId, childCardId);
  };

  removeDependency = (parentCardId: string, childCardId: string) => {
    return;
  };

  createDependencyGraph = (cardsById: Record<string, ICard>) => {
    this.removeDependencyApp();
    this.generateDependencySection();
    createDependencyGraph(this.computeNodesAndEdges(cardsById));
  };
}

export const dependencyManager = new DependencyManager();
