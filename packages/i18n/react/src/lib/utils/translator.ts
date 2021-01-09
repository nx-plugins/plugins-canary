import React from 'react';

export function translator(target, setSlot) {
  setSlot(React.createElement(React.Fragment, {
    children: target,
  }));
}
