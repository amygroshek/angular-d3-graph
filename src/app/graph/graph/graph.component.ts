import { Component, ElementRef, EventEmitter, ViewChild, HostListener, ViewEncapsulation, Input, Output, OnChanges, OnInit } from '@angular/core';
import * as _isEqual from 'lodash.isequal';

import { GraphService } from '../graph.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css'],
  providers: [ GraphService ],
  encapsulation: ViewEncapsulation.None
})
export class GraphComponent implements OnChanges, OnInit {
  private _activeValues = [];
  @ViewChild('graphContainer') element: ElementRef;
  @Input() settings;
  @Input() data;
  @Input() x1;
  @Input() x2;
  @Input()
  get activeValues() { return this._activeValues; }
  set activeValues(val) {
    if (!_isEqual(this._activeValues, val)) {
      this._activeValues = val;
      this.activeValuesChanged.emit(this._activeValues);
    }
  }
  @Output() activeValuesChanged = new EventEmitter();

  constructor(public graph: GraphService) {}

  ngOnInit() {
    this.graph.barHover.subscribe((val) => { this.activeValues = val; });
    this.graph.barClick.subscribe((val) => { this.activeValues = val; });
  }

  /**
   * When data changes update the graph or create one if it doesn't exist yet
   * When x1 / x2 values change, adjust the visible range to what's specified
   * @param changes
   */
  ngOnChanges(changes) {
    if (changes.data && this.element) {
      if (this.graph.isCreated()) {
        this.graph.update(changes.data.currentValue);
      } else {
        this.graph =
          this.graph.create(this.element.nativeElement, changes.data.currentValue, this.settings);
      }
    }
    if (changes.settings && this.graph.isCreated()) {
      this.graph.updateSettings(changes.settings.currentValue);
    }
    if (
      (changes.x1 || changes.x2) &&
      this.element && (this.x1 && this.x2) &&
      this.graph.isLineGraph()
    ) {
      this.graph.setVisibleRange(this.x1, this.x2);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(e) {
    this.graph.setDimensions().updateView('no-transition');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e) {
    if (this.graph.isLineGraph()) {
      const hoveredValues = this.graph.getValueAtPosition(e.offsetX);
      this.activeValues = hoveredValues;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e) {
    if (e.touches && e.touches.length === 1 && this.graph.isLineGraph()) {
      const hoveredValues = this.graph.getValueAtPosition(e.touches[0].offsetX);
      this.activeValues = hoveredValues;
    }
  }

  @HostListener('click', ['$event'])
  onClick(e) {
    if (this.graph.isLineGraph()) {
      const clickedValues = this.graph.getValueAtPosition(e.offsetX);
      this.activeValues = clickedValues;
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    // escape
    if (e.keyCode === 27) { return this.activeValues = null; }
    // left or right arrows
    const offset = e.keyCode === 37 ? -1 : (e.keyCode === 39 ? 1 : null);
    if (offset !== null) {
      const currentX = (this.activeValues && this.activeValues.length) ?
        this.activeValues[0][this.graph.settings.props.x] : null;
      const nextValues = this.graph.isLineGraph() ?
        this.graph.getLineValues(currentX, offset) : this.graph.getBarValue(currentX, offset);
      this.activeValues = nextValues;
    }
  }

  // activate the first item on focus
  @HostListener('focus', ['$event'])
  onFocus(e) {
    const nextValues = this.graph.isLineGraph() ?
      this.graph.getLineValues(null, 0) : this.graph.getBarValue(null, 0);
    this.activeValues = nextValues;
  }

  // remove any active highlights on blur
  @HostListener('blur', ['$event'])
  onBlur(e) {
    this.activeValues = null;
  }

  // remove any active highlights on blur
  @HostListener('mouseleave', ['$event'])
  onLeave(e) {
    this.activeValues = null;
  }

}
