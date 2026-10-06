import test from 'node:test';
import assert from 'node:assert/strict';
import { Circuit } from '../dist/engine.js';

const solve = circuit => {
  for(let i=0;i<9;i++)while(circuit.turns[i])circuit.rotate(i);
};

test('Haven, relay and Echo use different solved paths and external terminal orientations',()=>{
  const circuits=['outpost','relay','rover'].map(design=>new Circuit(47000,design));
  const paths=[[0,1,3,4,6,7,8],[0,1,2,3,5],[2,4,5,6,7]];
  const positions=[[{row:1,column:2},{row:5,column:4}],[{row:3,column:1},{row:3,column:5}],[{row:5,column:2},{row:1,column:4}]];
  assert.equal(new Set(circuits.map(c=>JSON.stringify(c.ports))).size,3);
  for(const [i,circuit]of circuits.entries()){
    solve(circuit);assert.equal(circuit.connected(),true);
    assert.deepEqual([...circuit.powered()].sort((a,b)=>a-b),paths[i]);
    assert.deepEqual(circuit.terminalPosition(circuit.input),positions[i][0]);
    assert.deepEqual(circuit.terminalPosition(circuit.output),positions[i][1]);
  }
  assert.match(circuits[0].instructions,/top edge of the top-left.*bottom edge of the bottom-right/);
  assert.match(circuits[1].instructions,/left edge of the middle-left.*right edge of the middle-right/);
  assert.match(circuits[2].hint(),/bottom-left.*down.*top-right.*up/);
});

test('every repair design starts unsolved and remains solvable across varied scramble seeds',()=>{
  for(const design of ['outpost','relay','rover'])for(let seed=0;seed<100;seed++){
    const circuit=new Circuit(seed,design);assert.equal(circuit.connected(),false,design+' '+seed);
    solve(circuit);assert.equal(circuit.connected(),true,design+' '+seed);
    const repeat=new Circuit(seed,design);assert.deepEqual(repeat.turns,new Circuit(seed,design).turns);
  }
});

test('a powered output tile is insufficient unless its wire reaches the correctly oriented external terminal',()=>{
  for(const design of ['outpost','relay','rover']){
    const circuit=new Circuit(3,design);solve(circuit);
    let turns=0;while(circuit.connections(circuit.input.index).includes(circuit.input.side)&&turns++<4)circuit.rotate(circuit.input.index);
    assert.equal(circuit.powered().size,0);assert.equal(circuit.connected(),false);
    solve(circuit);
    let rotations=0;while(circuit.connections(circuit.output.index).includes(circuit.output.side)&&rotations++<4)circuit.rotate(circuit.output.index);
    assert.equal(circuit.connected(),false);
  }
});
