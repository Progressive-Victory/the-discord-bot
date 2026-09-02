{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
    devenv.url = "github:cachix/devenv";
  };
  
  outputs = {self, nixpkgs, devenv, systems, ... }@inputs: 
      let forEachSystem = nixpkgs.lib.genAttrs (import systems);
          in {
            devShells = forEachSystem (system:
              let pkgs = nixpkgs.legacyPackages.${system};
              in { 
                default = devenv.lib.mkShell {
                  inherit inputs pkgs;
                  modules = [{ 
                    packages = with pkgs; [
                      pnpm
                      nodejs
                    ];
                    processes = {
                      dev.exec = "pnpm dev";
                    };
                 }];
                };
              });
          };
}
