(function(){
if(window.__mtIniciado&&document.getElementById('mt-mapa')&&document.getElementById('mt-mapa').__ok)return;
var $=function(i){return document.getElementById(i)};
function css(u){return new Promise(function(r){if(document.querySelector('link[href="'+u+'"]'))return r();var l=document.createElement('link');l.rel='stylesheet';l.href=u;l.onload=r;l.onerror=r;document.head.appendChild(l)})}
function js(u,t){return new Promise(function(r,j){if(t&&t())return r();var s=document.createElement('script');s.src=u;s.onload=r;s.onerror=j;document.head.appendChild(s)})}
Promise.all([css('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'),css('https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.css'),js('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',function(){return window.L&&L.version})]).then(function(){return js('https://unpkg.com/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.js',function(){return L.PM})}).then(iniciar).catch(function(){$('mt-load').style.display='block';$('mt-load').textContent='No se pudo cargar el mapa'});
function iniciar(){
window.__mtIniciado=1;
var el=$('mt-mapa');el.__ok=1;
var map=L.map(el,{zoomControl:true,worldCopyJump:true,minZoom:2}).setView(el.clientWidth<700?[9,-67]:[20,-35],el.clientWidth<700?5:3);window.__mtMap=map;map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
L.control.scale({imperial:false}).addTo(map);
var BASES=[
['Calles','https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}],
['Relieve','https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{maxZoom:17,attribution:'© OpenStreetMap · OpenTopoMap (CC-BY-SA)'}],
['Satélite','https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Imágenes © Esri'}],
['Atlas','https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'© Esri, National Geographic'}],
['Pergamino','https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'© Esri'}],
['Noche','https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxZoom:16,attribution:'© Esri'}]];
var capas={},baseAct=null,bb=$('mt-bases');
BASES.forEach(function(b){capas[b[0]]=L.tileLayer(b[1],b[2]);var x=document.createElement('button');x.type='button';x.className='mt-btn';x.textContent=b[0];x.onclick=function(){ponBase(b[0])};x.dataset.b=b[0];bb.appendChild(x)});
function ponBase(n){if(baseAct)map.removeLayer(capas[baseAct]);baseAct=n;capas[n].addTo(map);capas[n].bringToBack();[].forEach.call(bb.children,function(c){c.classList.toggle('on',c.dataset.b==n)});try{localStorage.setItem('mt-base',n)}catch(e){}}
var oscuro=document.documentElement.dataset.tema=='dark'||(document.documentElement.dataset.tema!='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
var b0=null;try{b0=localStorage.getItem('mt-base')}catch(e){}
ponBase(capas[b0]?b0:(oscuro?'Noche':'Calles'));
/* Mapas antiguos */
var OLD=[
['América',[
[51967,'El Orinoco ilustrado (Gumilla) · s. XVIII','Mapa del río Orinoco que acompaña la obra del jesuita José Gumilla. Biblioteca Nacional de Colombia.'],
[54835,'Virreinato de la Nueva Granada y Gobierno de Caracas · 1819','Lámina 69 del New Universal Atlas (1819). Biblioteca Nacional de Colombia.'],
[55714,'Mapa físico y político de Venezuela (Codazzi) · 1840','Facsímil del gran mapa de Agustín Codazzi, publicado junto a su Atlas físico y político.'],
[86391,'República de la Nueva Granada (Acosta) · 1847','Mapa del coronel Joaquín Acosta, dedicado al barón de Humboldt.'],
[57172,'Venezuela, Nueva Granada y Ecuador · s. XIX','Mapa de atlas coloreado de mediados del siglo XIX.'],
[71509,'Carta esférica de las islas Antillas','Carta náutica de las Antillas Menores. Colección Benson, Universidad de Texas.']]],
['Europa',[
[56267,'España y Portugal (Bowen) · 1761','«An accurate map of Spain & Portugal», de Emanuel Bowen, geógrafo del rey. Universidad Estatal de Míchigan.'],
[107006,'Ferrocarriles de las Provincias Vascongadas y Navarra','Red ferroviaria histórica del País Vasco y Navarra.'],
[34389,'El Imperio romano hacia el año 395 · Shepherd','Del atlas histórico de William R. Shepherd (1911). Universidad de Texas.'],
[101164,'Calzadas del Imperio romano','Red de calzadas romanas, griegas y fenicias. Wikimedia Commons (CC0).']]],
['Tierra Santa',[
[88248,'Palestina · 1790','Mapa de Tierra Santa de finales del siglo XVIII.']]]];
var sel=$('mt-old'),info={},oldLay=null;
sel.innerHTML='<option value="">Ninguno · solo el presente</option>'+OLD.map(function(g){return '<optgroup label="'+g[0]+'">'+g[1].map(function(m){info[m[0]]=m;return '<option value="'+m[0]+'">'+m[1]+'</option>'}).join('')+'</optgroup>'}).join('');
map.createPane('antiguo');map.getPane('antiguo').style.zIndex=350;
sel.onchange=function(){ponOld(sel.value,true)};
function ponOld(id,volar){if(oldLay){map.removeLayer(oldLay);oldLay=null}$('mt-oldctl').hidden=!id;if(!id){cortina(false);return}
oldLay=L.tileLayer('https://mapwarper.net/maps/tile/'+id+'/{z}/{x}/{y}.png',{pane:'antiguo',opacity:$('mt-op').value/100,maxZoom:19,attribution:'Mapa antiguo: Map Warper'}).addTo(map);
$('mt-oldinfo').innerHTML=info[id][2]+' <a href="https://mapwarper.net/maps/'+id+'" target="_blank" rel="noopener">Ficha</a>';
if(volar){$('mt-load').style.display='block';fetch('https://mapwarper.net/api/v1/maps/'+id+'.json').then(function(r){return r.json()}).then(function(j){var b=j.data.attributes.bbox.split(',').map(Number);map.flyToBounds([[b[1],b[0]],[b[3],b[2]]],{duration:1.2})}).catch(function(){}).then(function(){$('mt-load').style.display='none'})}
cortina($('mt-cort').checked)}
$('mt-op').oninput=function(){if(oldLay)oldLay.setOpacity(this.value/100)};
/* Cortina */
var sw=$('mt-sw'),swX=0.5;
function recorta(){var p=map.getPane('antiguo');if(!$('mt-cort').checked||!oldLay){p.style.clip='';return}var s=map.getSize(),nw=map.containerPointToLayerPoint([0,0]),se=map.containerPointToLayerPoint(s),x=map.containerPointToLayerPoint([s.x*swX,0]).x;p.style.clip='rect('+[nw.y,x,se.y,nw.x].join('px,')+'px)';sw.style.left=(s.x*swX)+'px'}
function cortina(on){sw.style.display=on&&oldLay?'block':'none';recorta()}
$('mt-cort').onchange=function(){cortina(this.checked)};
map.on('move zoom resize',recorta);
(function(){var arr=false,h=sw.querySelector('span');function mv(e){if(!arr)return;var r=$('mt-w').getBoundingClientRect(),cx=(e.touches?e.touches[0].clientX:e.clientX);swX=Math.min(.98,Math.max(.02,(cx-r.left)/r.width));recorta();e.preventDefault()}
h.addEventListener('mousedown',function(e){arr=true;map.dragging.disable();e.preventDefault()});h.addEventListener('touchstart',function(e){arr=true;map.dragging.disable();e.preventDefault()},{passive:false});
window.addEventListener('mousemove',mv);window.addEventListener('touchmove',mv,{passive:false});function fin(){if(arr){arr=false;map.dragging.enable()}}window.addEventListener('mouseup',fin);window.addEventListener('touchend',fin)})();
/* Coordenadas */
map.on('mousemove',function(e){$('mt-xy').textContent=e.latlng.lat.toFixed(4)+'°, '+e.latlng.lng.toFixed(4)+'°'});
/* Búsqueda */
var bt=null;
$('mt-bf').onsubmit=function(e){e.preventDefault();var q=$('mt-bq').value.trim();if(!q)return;var ul=$('mt-br');ul.innerHTML='<li>Buscando…</li>';
fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(a){ul.innerHTML='';if(!a.length){ul.innerHTML='<li>Sin resultados</li>';return}
a.forEach(function(p){var li=document.createElement('li');li.textContent=p.display_name;li.onclick=function(){var b=p.boundingbox.map(Number);map.flyToBounds([[b[0],b[2]],[b[1],b[3]]],{maxZoom:15,duration:1.2});if(bt)map.removeLayer(bt);bt=L.circleMarker([+p.lat,+p.lon],{radius:8,color:'#b08d3c',weight:3,fillColor:'#13254a',fillOpacity:.9}).addTo(map).bindPopup('<div class="mt-pop"><small>Lugar</small><b>'+esc(p.display_name.split(',')[0])+'</b>'+esc(p.display_name)+'</div>');ul.innerHTML=''};ul.appendChild(li)})}).catch(function(){ul.innerHTML='<li>No se pudo buscar ahora</li>'})};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pin(color){return L.divIcon({className:'',iconSize:[26,34],iconAnchor:[13,33],popupAnchor:[0,-30],html:'<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13 1C6.4 1 1 6.3 1 12.8 1 22 13 33 13 33s12-11 12-20.2C25 6.3 19.6 1 13 1z" fill="'+color+'" stroke="#b08d3c" stroke-width="2"/><circle cx="13" cy="12.6" r="4.4" fill="#f3e3b5"/></svg>'})}
/* Lugares de nuestros artículos */
var LUG=[
['el-numero-17',[[12.108,-68.933,'Willemstad, Curazao'],[10.136,-64.686,'Barcelona'],[9.745,-63.183,'Maturín, Monagas']]],
['tierra-de-gracia',[[10.71,-61.92,'Península de Paria: la Tierra de Gracia, 1498']]],
['una-semilla',[[10.497,-66.853,'Chacao, 1784'],[7.894,-72.505,'Cúcuta, 1835'],[8.15,-63.55,'El Orinoco, 1730']]],
['nogales',[[7.767,-72.225,'San Cristóbal, 1877']]],
['la-espada-de-oro',[[-12.046,-77.043,'Lima, 1825']]],
['la-gran-colombia',[[8.122,-63.549,'Angostura, 1819'],[11.241,-74.205,'Santa Marta, 1830']]],
['estudiar-en-el-mundo',[[40.962,-5.667,'Universidad de Salamanca'],[55.947,-3.187,'Universidad de Edimburgo'],[42.374,-71.117,'Universidad de Harvard']]],
['fernandez-moran',[[10.654,-71.64,'Maracaibo, 1924'],[59.329,18.069,'Estocolmo, 1999']]],
['fiesta-doble',[[10.648,-71.612,'Casa y museo de Urdaneta, Maracaibo']]],
['intendente',[[10.506,-66.914,'Caracas: la Intendencia']]],
['economia',[[10.82,-64.19,'Cubagua: las perlas'],[10.506,-66.914,'Caracas']]],
['cronicas-de-la-venezuela-colonial',[[10.506,-66.914,'Caracas colonial']]]];
var artLay=L.layerGroup(),artsPos=[];
fetch('/feeds/posts/default?alt=json&max-results=150').then(function(r){return r.json()}).then(function(j){var es=j.feed.entry||[];var mapo=[];
es.forEach(function(e){var u=(e.link.filter(function(l){return l.rel=='alternate'})[0]||{}).href||'',t=e.title.$t,im=(e.media$thumbnail&&e.media$thumbnail.url||'').replace(/\/s72-c\//,'/w640/'),cats=(e.category||[]).map(function(c){return c.term});
var cm=(e.content&&e.content.$t||'').match(/<img[^>]+src="([^"]+)"/);if(cm)im=cm[1].replace(/\/s\d+(-[a-z]+)?\/|\/w\d+-h\d+[^/]*\//,'/w640/');
LUG.forEach(function(g){if(u.indexOf(g[0])>-1)g[1].forEach(function(p){L.marker([p[0],p[1]],{icon:pin('#13254a')}).bindPopup('<div class="mt-pop"><small>De nuestros artículos</small>'+(im?'<img src="'+esc(im)+'" alt="">':'')+'<b>'+esc(p[2])+'</b>'+esc(t)+'<br><a href="'+esc(u)+'">Leer el artículo →</a></div>').addTo(artLay)})});
if(cats.some(function(c){return /mapoteca/i.test(c)}))mapo.push([u,t,im])});
if(mapo.length){$('mt-arts').hidden=false;$('mt-arts-g').innerHTML=mapo.map(function(a){return '<a href="'+esc(a[0])+'">'+(a[2]?'<img loading="lazy" src="'+esc(a[2])+'" alt="">':'')+'<div>'+esc(a[1])+'</div></a>'}).join('')}}).catch(function(){});
function capArts(){if($('mt-c-arts').checked)artLay.addTo(map);else map.removeLayer(artLay)}
$('mt-c-arts').onchange=capArts;capArts();
/* Batallas (Wikidata) y Wikipedia */
var batLay=L.layerGroup().addTo(map),wikLay=L.layerGroup().addTo(map),tmo=null;
function zona(){clearTimeout(tmo);tmo=setTimeout(function(){if($('mt-c-bat').checked)batallas();if($('mt-c-wiki').checked)wiki()},500)}
map.on('moveend',zona);
$('mt-c-bat').onchange=function(){if(this.checked)batallas();else batLay.clearLayers()};
$('mt-c-wiki').onchange=function(){if(this.checked)wiki();else wikLay.clearLayers()};
var bSeq=0;
function batallas(){var b=map.getBounds(),w=Math.max(-180,b.getWest()),e=Math.min(180,b.getEast()),s=Math.max(-85,b.getSouth()),n=Math.min(85,b.getNorth());if((e-w)>90){$('mt-capinfo').textContent='Acerca un poco el mapa para ver las batallas de la zona.';batLay.clearLayers();return}
var q='SELECT ?b ?bLabel ?c ?d ?art WHERE { SERVICE wikibase:box { ?b wdt:P625 ?c. bd:serviceParam wikibase:cornerWest "Point('+w+' '+s+')"^^geo:wktLiteral. bd:serviceParam wikibase:cornerEast "Point('+e+' '+n+')"^^geo:wktLiteral. } ?b wdt:P31/wdt:P279* wd:Q178561. OPTIONAL{?b wdt:P585 ?d} OPTIONAL{?b wdt:P580 ?d} OPTIONAL{?art schema:about ?b; schema:isPartOf <https://es.wikipedia.org/>} SERVICE wikibase:label{bd:serviceParam wikibase:language "es,en"} } LIMIT 400';
var my=++bSeq;$('mt-load').style.display='block';
fetch('https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){if(my!=bSeq)return;batLay.clearLayers();var vis={};
j.results.bindings.forEach(function(x){if(vis[x.b.value])return;vis[x.b.value]=1;var m=x.c.value.match(/Point\(([-\d.eE]+) ([-\d.eE]+)\)/);if(!m)return;var an=x.d?x.d.value.slice(0,x.d.value.indexOf('-',1)):'';if(an&&an[0]=='+')an=an.slice(1);
L.circleMarker([+m[2],+m[1]],{radius:7,color:'#b08d3c',weight:2,fillColor:'#8b1e1e',fillOpacity:.85}).bindPopup('<div class="mt-pop"><small>Batalla'+(an?' · '+esc(an.replace(/^0+/,'')):'')+'</small><b>'+esc(x.bLabel.value)+'</b>'+(x.art?'<a href="'+esc(x.art.value)+'" target="_blank" rel="noopener">Leer en Wikipedia →</a>':'<a href="'+esc(x.b.value)+'" target="_blank" rel="noopener">Ficha en Wikidata →</a>')+'</div>').addTo(batLay)});
$('mt-capinfo').textContent=Object.keys(vis).length+' batallas en esta zona.'}).catch(function(){$('mt-capinfo').textContent='Wikidata no respondió; prueba de nuevo.'}).then(function(){if(my==bSeq)$('mt-load').style.display='none'})}
var wSeq=0;
function wiki(){var b=map.getBounds();if(map.getZoom()<9){$('mt-capinfo').textContent='Acerca el mapa a una ciudad para ver sus artículos de Wikipedia.';wikLay.clearLayers();return}
var n=Math.min(85,b.getNorth()),s=Math.max(-85,b.getSouth()),w=b.getWest(),e=b.getEast(),my=++wSeq;
fetch('https://es.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=geosearch&ggslimit=60&ggsbbox='+[n,w,s,e].join('|')+'&prop=coordinates|pageimages|extracts&exintro=1&explaintext=1&exsentences=2&exlimit=60&piprop=thumbnail&pithumbsize=320&pilimit=60').then(function(r){return r.json()}).then(function(j){if(my!=wSeq)return;wikLay.clearLayers();var ps=j.query&&j.query.pages||{},c=0;
Object.keys(ps).forEach(function(k){var p=ps[k];if(!p.coordinates)return;c++;L.marker([p.coordinates[0].lat,p.coordinates[0].lon],{icon:pin('#b08d3c')}).bindPopup('<div class="mt-pop"><small>Wikipedia</small>'+(p.thumbnail?'<img src="'+esc(p.thumbnail.source)+'" alt="">':'')+'<b>'+esc(p.title)+'</b>'+esc(p.extract||'')+'<br><a href="https://es.wikipedia.org/?curid='+p.pageid+'" target="_blank" rel="noopener">Leer más →</a></div>',{maxWidth:280}).addTo(wikLay)});
$('mt-capinfo').textContent=c+' artículos de Wikipedia en esta zona.'}).catch(function(){})}
/* Herramientas de dibujo */
try{map.pm.setLang('es')}catch(e){}
map.pm.addControls({position:'topleft',drawCircleMarker:false,drawRectangle:false,rotateMode:false,cutPolygon:false});
map.pm.setGlobalOptions({pathOptions:{color:'#b08d3c',weight:4,fillColor:'#13254a',fillOpacity:.18}});
var est=L.featureGroup().addTo(map);
var COL={'Oro':'#b08d3c','Azul':'#13254a','Granate':'#8b1e1e','Verde':'#2f6b3a','Negro':'#1b1b1b'};
function km(l){if(l<1000)return Math.round(l)+' m';return (l/1000).toLocaleString('es',{maximumFractionDigits:l<1e5?1:0})+' km'}
function largo(ll){var t=0;for(var i=1;i<ll.length;i++)t+=ll[i-1].distanceTo(ll[i]);return t}
function area(ll){var R=6378137,a=0,n=ll.length;if(n<3)return 0;for(var i=0;i<n;i++){var p1=ll[i],p2=ll[(i+1)%n];a+=(p2.lng-p1.lng)*Math.PI/180*(2+Math.sin(p1.lat*Math.PI/180)+Math.sin(p2.lat*Math.PI/180))}return Math.abs(a*R*R/2)}
function km2(a){return a<1e6?Math.round(a).toLocaleString('es')+' m²':(a/1e6).toLocaleString('es',{maximumFractionDigits:a<1e8?1:0})+' km²'}
function medida(l){if(l instanceof L.Circle)return 'Radio '+km(l.getRadius())+' · área '+km2(Math.PI*l.getRadius()*l.getRadius());if(l instanceof L.Polygon){var r=l.getLatLngs()[0];return 'Área '+km2(area(r))+' · perímetro '+km(largo(r.concat([r[0]])))}if(l instanceof L.Polyline)return 'Longitud '+km(largo(l.getLatLngs()));if(l.getLatLng){var p=l.getLatLng();return p.lat.toFixed(4)+'°, '+p.lng.toFixed(4)+'°'}return ''}
function props(l){l.feature=l.feature||{type:'Feature',properties:{}};return l.feature.properties}
function estilo(l){var pr=props(l),c=COL[pr.color]||COL['Oro'];if(l.setStyle)l.setStyle({color:c,fillColor:c=='#b08d3c'?'#13254a':c});else if(l.setIcon&&!(l.options&&l.options.textMarker))l.setIcon(pin(c))}
function tipo(l){if(l.options&&l.options.textMarker)return 'Texto';if(l instanceof L.Circle)return 'Círculo';if(l instanceof L.Polygon)return 'Territorio';if(l instanceof L.Polyline)return 'Ruta';return 'Lugar'}
function contenido(l){var pr=props(l);var d=document.createElement('div');d.className='mt-pop mt-form';
d.innerHTML='<small>Mi estudio · '+tipo(l)+'</small><div class="mt-med">'+esc(medida(l))+'</div>'+(l.options&&l.options.textMarker?'':'<input placeholder="Título" value="'+esc(pr.titulo)+'"><textarea placeholder="Notas, fuentes, fechas…">'+esc(pr.nota)+'</textarea>')+'<select>'+Object.keys(COL).map(function(k){return '<option'+(pr.color==k?' selected':'')+'>'+k+'</option>'}).join('')+'</select><button class="mt-btn" type="button">Guardar</button>';
d.querySelector('button').onclick=function(){var i=d.querySelector('input'),t=d.querySelector('textarea');if(i)pr.titulo=i.value;if(t)pr.nota=t.value;pr.color=d.querySelector('select').value;estilo(l);if(l.bindTooltip&&pr.titulo){l.unbindTooltip();l.bindTooltip(pr.titulo,{direction:'top'})}guarda();l.closePopup()};return d}
function prepara(l){l.bindPopup(function(){return contenido(l)},{minWidth:240});var pr=props(l);estilo(l);if(pr.titulo)l.bindTooltip(pr.titulo,{direction:'top'});l.on('pm:edit pm:dragend pm:textchange',guarda)}
map.on('pm:create',function(e){var l=e.layer;map.removeLayer(l);est.addLayer(l);prepara(l);guarda();if(!(l.options&&l.options.textMarker))setTimeout(function(){l.openPopup()},150)});
map.on('pm:remove',function(e){est.removeLayer(e.layer);guarda()});
function aGeo(){var fs=[];est.eachLayer(function(l){var f=l.toGeoJSON();var pr=JSON.parse(JSON.stringify(props(l)));if(l instanceof L.Circle)pr._radio=l.getRadius();if(l.options&&l.options.textMarker)pr._texto=(l.pm&&l.pm.getText&&l.pm.getText())||l.options.text||'';f.properties=pr;fs.push(f)});return {type:'FeatureCollection',features:fs}}
function guarda(){try{localStorage.setItem('mt-estudio',JSON.stringify(aGeo()));$('mt-est').textContent='Guardado en este navegador · '+est.getLayers().length+(est.getLayers().length==1?' elemento.':' elementos.')}catch(e){$('mt-est').textContent='No se pudo guardar en este navegador.'}}
function carga(g){(g.features||[]).forEach(function(f){var pr=f.properties||{},l;
if(f.geometry.type=='Point'){var ll=[f.geometry.coordinates[1],f.geometry.coordinates[0]];if(pr._radio)l=L.circle(ll,{radius:pr._radio});else if(pr._texto!=null)l=L.marker(ll,{textMarker:true,text:pr._texto});else l=L.marker(ll,{icon:pin('#b08d3c')})}else l=L.geoJSON(f).getLayers()[0];
if(!l)return;l.feature={type:'Feature',properties:pr};est.addLayer(l);prepara(l)});guarda()}
try{var s0=localStorage.getItem('mt-estudio');if(s0)carga(JSON.parse(s0))}catch(e){}
$('mt-exp').onclick=function(){var b=new Blob([JSON.stringify(aGeo(),null,1)],{type:'application/geo+json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='mi-estudio-mapoteca.geojson';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500)};
$('mt-imp').onclick=function(){$('mt-file').click()};
$('mt-file').onchange=function(){var f=this.files[0];if(!f)return;f.text().then(function(t){var g=JSON.parse(t);carga(g);if(est.getLayers().length)map.fitBounds(est.getBounds(),{maxZoom:12})}).catch(function(){$('mt-est').textContent='Ese archivo no parece un estudio válido.'});this.value=''};
$('mt-borr').onclick=function(){if(!est.getLayers().length)return;if(confirm('¿Borrar todo tu estudio de este navegador?')){est.clearLayers();guarda()}};
$('mt-full').onclick=function(){var w=$('mt-w');if(document.fullscreenElement)document.exitFullscreen();else if(w.requestFullscreen)w.requestFullscreen()};
document.addEventListener('fullscreenchange',function(){setTimeout(function(){map.invalidateSize();recorta()},200)});
/* Enlaces directos: #mapa=lat,lng,zoom,idAntiguo */
var h=location.hash.match(/mapa=([-\d.]+),([-\d.]+),(\d+)(?:,(\d+))?/);
if(h){map.setView([+h[1],+h[2]],+h[3],{animate:false});if(h[4]){sel.value=h[4];ponOld(h[4],false)}}
setTimeout(function(){map.invalidateSize()},300);if(window.ResizeObserver)new ResizeObserver(function(){map.invalidateSize({pan:false});recorta()}).observe($('mt-w'));
}
})();
