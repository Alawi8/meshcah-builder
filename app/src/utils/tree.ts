import type { BuilderElement } from '../types';
import { generateId } from './id';

export function findElement(
  elements: BuilderElement[],
  id: string
): BuilderElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    const found = findElement(el.children, id);
    if (found) return found;
  }
  return null;
}

export function findParent(
  elements: BuilderElement[],
  id: string,
  parent: BuilderElement | null = null
): { parent: BuilderElement | null; index: number } | null {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) return { parent, index: i };
    const found = findParent(elements[i].children, id, elements[i]);
    if (found) return found;
  }
  return null;
}

export function removeElement(
  elements: BuilderElement[],
  id: string
): BuilderElement[] {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => ({
      ...el,
      children: removeElement(el.children, id),
    }));
}

export function insertElement(
  elements: BuilderElement[],
  parentId: string | null,
  element: BuilderElement,
  position: number
): BuilderElement[] {
  if (parentId === null) {
    const copy = [...elements];
    copy.splice(position, 0, element);
    return copy;
  }
  return elements.map((el) => {
    if (el.id === parentId) {
      const children = [...el.children];
      children.splice(position, 0, element);
      return { ...el, children };
    }
    return { ...el, children: insertElement(el.children, parentId, element, position) };
  });
}

export function updateElement(
  elements: BuilderElement[],
  id: string,
  patch: { props?: Partial<BuilderElement['props']>; styles?: Partial<BuilderElement['styles']> }
): BuilderElement[] {
  return elements.map((el) => {
    if (el.id === id) {
      return {
        ...el,
        props: patch.props ? { ...el.props, ...patch.props } : el.props,
        styles: patch.styles ? Object.fromEntries(
          Object.entries({ ...el.styles, ...patch.styles }).filter(([, v]) => v !== undefined)
        ) : el.styles,
      };
    }
    return { ...el, children: updateElement(el.children, id, patch) };
  });
}

export function isDescendant(elements: BuilderElement[], ancestorId: string, childId: string): boolean {
  const ancestor = findElement(elements, ancestorId);
  if (!ancestor) return false;
  return !!findElement(ancestor.children, childId);
}

export function deepClone(element: BuilderElement): BuilderElement {
  return {
    ...element,
    id: generateId(),
    props: { ...element.props },
    styles: { ...element.styles },
    children: element.children.map(deepClone),
  };
}
