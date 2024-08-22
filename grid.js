
/*
y^2+(x/2)^2=x^2
rac(4/3)*y=x
*/

var tri=[];
var vertices=[];

const grid_n=2;
var grid_m=Math.floor(w/(h/grid_n*1.1547));
var gridx=w/grid_n,gridy=h/grid_m; ///gridx should be w/, but no care for n<25

var mat=[];
for (let i=0;i<grid_n+1;++i) {
	var y=i*gridy;
	var x, row=[];
	mat.push(row);
	x=0; row.push([x,y]);
	for (let j=0; j<grid_m-1+(i%2);++j) {
		x=(1+j-0.5*(i%2))*gridx;
		row.push([x,y]);
	}
	x=w; row.push([x,y]);
}
// vertices.push(... mat.flat());
var tmp=[];
for (let j=0; j<mat[0].length-1;++j){
	tmp.push([mat[0][j],mat[0][j+1],mat[1][1+j]]);
}
for (let i=1; i<mat.length-1;++i){
	for (let j=0; j<mat[i].length-1;++j){
		tmp.push([mat[i][j],mat[i][j+1],mat[i+1][1+j-(i%2)]]);
		tmp.push([mat[i][j],mat[i][j+1],mat[i-1][1+j-(i%2)]]);
	}
}
var last=mat.length-1;
for (let j=0; j<mat[last].length-1;++j){
	tmp.push([mat[last][j],mat[last][j+1],mat[last-1][1+j-(last%2)]]);
}
tmp




