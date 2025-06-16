export function getSnapPosition(component, snapPoint) {
  return [0, 1, 0]
}

export const simpleSnapLogic = {
  enabled: true,
  getPosition: getSnapPosition,
}
