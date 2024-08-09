if (!Array.prototype.toColor) Object.defineProperty(Array.prototype,"toColor",{value(){ return '#'+this.map(hexByte).join('') ; }});

const inB=[0,1,1,2,2,0], inm=[1,0,2,1,0,2], ins=[2,2,0,0,1,1];
function getColorFast(hue,sat=0.0,val=1.0) {/// input is a float between 0 and 6
	var i=Math.floor(hue);
	var s=hue-i;
	s=Math.sin(s*Math.PI/2); /// can cache
	s=Math.floor(s*255);
	if (i%2==1)s=255-s;
	var ret=[];
	ret[inB[i]]=Math.floor(255*val);
	ret[ins[i]]=Math.floor(sat*255*val);
	ret[inm[i]]=Math.floor((sat*255+(1-sat)*s)*val);
	return ret;
}