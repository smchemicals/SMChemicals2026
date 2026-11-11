/*
 * Is this WebGL context drawing on a real graphics card, or on the CPU pretending to be one? Browsers fall back to a software
 * renderer when a machine has no usable GPU (a virtual machine, a remote desktop, a blocklisted driver). It runs the
 * shaders, but far too slowly to animate: the liquid hero would eat the CPU and stutter. On those machines the hero is drawn
 * once, as a still, instead. A real GPU, including a weak integrated one, is never treated this way.
 */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|mesa offscreen|apple software/i;

export function isSoftwareRenderer(gl: WebGLRenderingContext): boolean {
	try {
		const info = gl.getExtension("WEBGL_debug_renderer_info");
		if (!info) return false;
		const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? "");
		return SOFTWARE.test(renderer);
	} catch {
		return false;
	}
}
