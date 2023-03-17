import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 300
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//Texture loader
const textureLoader = new THREE.TextureLoader()
const starTexture = textureLoader.load('/textures/particles/stars.png')

/**
 * Background stars
 */
const starsGeometry = new THREE.BufferGeometry()
const starsCount = 800
const positions = new Float32Array(starsCount * 3)

for (let i = 0; i < starsCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 40
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

//Material
const starsMaterial = new THREE.PointsMaterial({
    size: 0.3,
    sizeAttenuation: true,
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    alphaMap: starTexture

})

//Points
const stars = new THREE.Points(starsGeometry, starsMaterial)
scene.add(stars)


/**
 * Galaxy
 */
const parameters = {}
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 6
parameters.branches = 4
parameters.spin = 1.2
parameters.randomness = 0.45
parameters.randomnessPower = 0.144
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'
parameters.attenuation = true
parameters.reset = function (){
    resetCamera()
}

let geometry = null
let material = null
let points = null

const galaxyGenerator = () => {
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)

    const insideColor = new THREE.Color(parameters.insideColor)
    const outsideColor = new THREE.Color(parameters.outsideColor)

    
    for(let i =0; i < parameters.count; i++)
    {
        const i3 = i * 3

        //Positons
        const radius = Math.random() * parameters.radius
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2
        const spinAngle = radius * parameters.spin

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        //Colors
        const mixedColors = insideColor.clone()
        mixedColors.lerp(outsideColor, radius / parameters.radius)

        colors[i3    ] = mixedColors.r
        colors[i3 + 1] = mixedColors.g
        colors[i3 + 2] = mixedColors.b
    }

    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
    )

    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
    )

    /**
     * Material Galaxy
     */
    material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: parameters.attenuation,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)
    scene.add(points)
}

galaxyGenerator()

/**
 * Adding gui elements to control the galaxy
 */
gui.add(parameters, 'count').min(100).max(200000).step(100).onFinishChange(galaxyGenerator)
gui.add(parameters, 'size').min(0.001).max(0.1).step(0.001).onFinishChange(galaxyGenerator)
gui.add(parameters, 'attenuation').name('Attenuation').onFinishChange(galaxyGenerator)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(galaxyGenerator)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(galaxyGenerator)
gui.add(parameters, 'spin').min(-5).max(5).step(0.1).onFinishChange(galaxyGenerator)
gui.add(parameters, 'randomness').min(0.01).max(2).step(0.01).onFinishChange(galaxyGenerator).name('noise')
gui.add(parameters, 'randomnessPower').min(-1).max(10).step(0.001).onFinishChange(galaxyGenerator).name('power')
gui.addColor(parameters, 'insideColor').onFinishChange(galaxyGenerator)
gui.addColor(parameters, 'outsideColor').onFinishChange(galaxyGenerator)
gui.add(parameters, 'reset').name("Reset Camera")

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 9
camera.position.z = 10
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.enablePan = false
controls.minDistance = 2
controls.maxDistance = 20

function resetCamera(){
    controls.reset()
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //Animate galaxy
    points.rotation.y = elapsedTime / 3

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()