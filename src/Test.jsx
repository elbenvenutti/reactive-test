import React from 'react';
import functional from 'react-functional';
import {dom} from 'react-reactive-class';
import {BehaviorSubject, Subject, Observable} from 'rx-lite';

const {div: Div, span: Span} = dom;

const visible$ = new BehaviorSubject(true);
const toggleClicked$ = new Subject();

toggleClicked$.withLatestFrom(visible$).subscribe(([, visible]) => visible$.onNext(!visible));

visible$.subscribe(console.log)

const C1 = (props, component) => {
  const seconds$ = Observable.interval(1000).startWith('wait...');
  const events = {
    c3Click: new Subject()
  };

  events.c3Click.subscribe(() => console.log('this still works after mounting and unmounting'));

  return <Div mount={visible$}>
    This is C1.
    <FunctionalC2 seconds$={seconds$} events={events}/>
  </Div>;
};

C1.componentWillMount = (props, refs, component) => {
  console.log('C1 will mount and remain mounted as it is a functional wrapper over the reactive one. I find this surprising.');
};

C1.componentWillUnmount = (props, refs, component) => {
  console.log('C1 will unmount');
};

const C2 = ({seconds$, events}, component) => {
  console.log('Contrary to my beliefs, this is run every single time that the component is mounted');
  component.thisDies$ = new Subject();
  component.aSubscription = Observable.interval(1000).startWith('wait again...').subscribe(component.thisDies$);

  const c3Seconds$ = seconds$.map(s => s+s);
  return <div>
    This is C2. with <Span>{component.thisDies$}</Span>
    <FunctionalC3 seconds$={seconds$} c3Seconds$={c3Seconds$} events={events}/>
  </div>;
};

C2.componentWillMount = (props, refs, component) => {
  console.log('C2 will mount');
};

C2.componentWillUnmount = (props, refs, component) => {
  console.log('C2 will unmount');
  component.thisDies$.onCompleted();
  component.aSubscription.dispose();
};

const C3 = ({seconds$, c3Seconds$, events}, component) => {
  const youWillDie$ = new Subject();

  component.subscription = youWillDie$.subscribe(() => events.c3Click.onNext());

  return <div>
    And this is C3.
    <Div>{seconds$}</Div>
    <Div>{c3Seconds$}</Div>
    <button onClick={() => youWillDie$.onNext()}>This does not break it either.</button>
  </div>
};

C3.componentWillMount = (props, refs, component) => {
  console.log('C3 will mount');
};

C3.componentWillUnmount = (props, refs, component) => {
  console.log('C3 will unmount');
  component.subscription.dispose();
};

const FunctionalC1 = functional(C1);

const FunctionalC2 = functional(C2);

const FunctionalC3 = functional(C3);

export default () => <div>
  <button onClick={() => toggleClicked$.onNext()}>Toggle the shiz</button>
  <FunctionalC1 />
</div>;
