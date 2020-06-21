module.exports = {
    mode: "development",
    target: "node",
    entry: "./src/index.ts",
    output: {
        filename: "prostgres-storage.js",
        path: __dirname + "/build"
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' extension will be handled by 'ts-loader'.
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between
    // builds.
    externals: []
};
