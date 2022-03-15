import {id} from './dummy-id.mjs?pipe=trickle(d1)';
import {val} from './dummy-val.mjs?pipe=trickle(d1)';
document.getElementById(id).textContent = val;
