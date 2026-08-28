import SwiftUI
import AppKit

let inputPath = "/Users/nartnos/.gemini/antigravity/brain/a1bf1081-018e-41d4-b081-de2d545ff175/skillet_icon_flat_1787829605425.jpg"
let outputPath = "/Users/nartnos/Developer/work/skillet/public/icon.png"

guard let nsImage = NSImage(contentsOfFile: inputPath) else {
    print("Failed to load input image")
    exit(1)
}

// Full-bleed square icon — NO rounded corners, NO shadow, NO padding.
// macOS automatically applies its own squircle mask to dock icons.
struct IconView: View {
    let image: Image
    
    var body: some View {
        image
            .resizable()
            // Crop out the original image margins (16% on each side)
            .scaleEffect(1.0 / 0.68)
            .frame(width: 1024, height: 1024)
            .clipped()
    }
}

@MainActor
func renderIcon() {
    let view = IconView(image: Image(nsImage: nsImage))
    let renderer = ImageRenderer(content: view)
    renderer.scale = 1.0
    
    guard let cgImage = renderer.cgImage else {
        print("Failed to render cgImage")
        exit(1)
    }
    
    let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
    guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
        print("Failed to convert to PNG")
        exit(1)
    }
    
    do {
        try pngData.write(to: URL(fileURLWithPath: outputPath))
        print("Generated full-bleed icon at: \(outputPath)")
    } catch {
        print("Failed to write output: \(error)")
        exit(1)
    }
}

Task { @MainActor in
    renderIcon()
    exit(0)
}

RunLoop.main.run()
