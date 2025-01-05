import { Directory } from 'fllib'
import { Node, NodeInstance, NodeLibrary, Effect, EffectLibrary } from 'fllib/utf/alchemy'
import { writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const { values: { file } } = parseArgs({ options: { file: { type: 'string', short: 'f' } } })
if (!file) throw new Error('Alchemy file not specified')

let root = new Directory()

// Create sphere emitter from template.
const emitterSphere = Node.initialize('FxSphereEmitter', 'test#1.emt')

// Create basic appearance from template.
const appearanceSparkles = Node.initialize('FxBasicAppearance', 'test#1.app')

// Create alchemy nodes library.
let nodes = new NodeLibrary()

// Add both nodes to library.
nodes.add(emitterSphere)
nodes.add(appearanceSparkles)

// ---------------------------------------------------------------

// Create new effect with default attachment 'instance'.
const effect = Effect.withAttachment()

// Create instances for emitter and appearance to use in effect.
const instanceSphere = NodeInstance.fromNode(emitterSphere)
const instanceSparkles = NodeInstance.fromNode(appearanceSparkles)

// Assign appearance as target for emitter (appearance visualizes particles that emitter produces).
instanceSphere.targets.add(instanceSparkles)

// Assign sphere emitter instance to effect attachment instance.
effect.attachment?.add(instanceSphere)

// Assign sparkles appearance instance to effect attachment instance.
effect.attachment?.add(instanceSparkles)    

// Create alchemy effects library.
let effects = new EffectLibrary()

// Assign effect to effects library with a given name.
effects.set('test_fx', effect)

root.write(effects)
root.write(nodes)

await writeFile(file, root.toBuffer())
