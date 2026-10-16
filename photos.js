export async function readPhoto(file){
 if(!file||!file.type.startsWith('image/'))throw Error('请选择照片文件。');
 if(file.size>15000000)throw Error('这张照片太大，请选择15MB以内的图片。');
 const url=URL.createObjectURL(file);
 try {const image=new Image();image.src=url;await image.decode();const ratio=Math.min(1,720/image.width,720/image.height);const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*ratio);canvas.height=Math.round(image.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);let result=canvas.toDataURL('image/jpeg',.7);if(result.length>350000)result=canvas.toDataURL('image/jpeg',.4);if(result.length>350000)throw Error('照片细节较多，请换一张更小的图片。');return result;}catch(e){throw Error(e.message.includes('照片')?e.message:'无法打开这张照片，请使用 JPG、PNG 或 WebP 格式。');}finally{URL.revokeObjectURL(url);}
}
